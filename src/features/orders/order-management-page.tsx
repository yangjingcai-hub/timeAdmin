import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { CircleAlert, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import type { Order } from './order-types'
import { ordersPath, toOrder, type AdminOrderResponse, type OrdersPage } from './order-api'
import { OrderDetail } from './order-detail'
import { OrderFilters } from './order-filters'
import { defaultOrderFilters, downloadOrders, type OrderFilters as FilterValues, type OrderRange } from './order-model'
import { OrderStats } from './order-stats'
import { OrderTable } from './order-table'
import './orders.css'

export function OrderManagementPage() {
  const { request } = useAdminAuth()
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState<OrderRange>('all')
  const [filters, setFilters] = useState(defaultOrderFilters)
  const [requestedPage, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Order | null>(null)
  const [result, setResult] = useState<{ path: string; data: OrdersPage } | null>(null)
  const [failure, setFailure] = useState('')
  const [detailFailure, setDetailFailure] = useState('')
  const [reload, setReload] = useState(0)
  const [exporting, setExporting] = useState(false)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const userId = params.get('userId') ?? ''
  const path = ordersPath({ ...filters, userId }, range, requestedPage, pageSize)
  const data = result?.path === path ? result.data : undefined
  const orders = data?.items.map(toOrder) ?? []
  const userEmail = orders.find(order => order.userId === userId)?.email
  const page = data?.page ?? requestedPage
  const pageCount = Math.ceil((data?.total ?? 0) / pageSize)

  useEffect(() => {
    const controller = new AbortController()
    setFailure('')
    request<OrdersPage>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ path, data })
    }).catch(() => {
      if (controller.signal.aborted) return
      setResult(null)
      setFailure('订单获取失败，请检查后端服务后重试。')
    })
    return () => controller.abort()
  }, [path, request, reload])

  useEffect(() => {
    const refresh = () => { if (!document.hidden) setReload(value => value + 1) }
    const timer = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])

  useEffect(() => {
    if (!detailId) return
    const controller = new AbortController()
    setDetail(null)
    setDetailFailure('')
    request<AdminOrderResponse>(`/api/v1/admin/orders/${detailId}`, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setDetail(toOrder(value))
    }).catch(() => { if (!controller.signal.aborted) setDetailFailure('订单详情读取失败，请关闭后重试。') })
    return () => controller.abort()
  }, [detailId, request])

  function clearUserFilter() {
    const next = new URLSearchParams(params); next.delete('userId'); setParams(next, { replace: true }); setPage(1)
  }
  function changeRange(next: OrderRange) { setRange(next); setPage(1) }
  function changeFilters(next: FilterValues) { setFilters(next); setPage(1) }
  function clearFilters() { changeFilters(defaultOrderFilters); changeRange('all'); clearUserFilter() }
  function showExceptions() { clearUserFilter(); changeFilters({ ...defaultOrderFilters, status: 'paid', exceptionOnly: true }) }
  function openDetail(order: Order, trigger: HTMLButtonElement) { detailTrigger.current = trigger; setDetailId(order.orderId) }
  async function handleException(order: Order) {
    let value: AdminOrderResponse
    try { value = await request<AdminOrderResponse>(`/api/v1/admin/orders/${order.orderId}/retry-activation`, {
      method: 'POST', headers: { 'X-FocusTime-Admin': '1' },
    }) } catch { throw new Error('后端重试未完成，请检查服务后再试。') }
    setDetail(toOrder(value)); setReload(current => current + 1)
    if (value.order.activationStatus !== 'activated') throw new Error('会员开通仍失败，异常及处理日志已保留，请检查后端服务。')
  }
  async function exportOrders() {
    if (exporting) return
    setExporting(true); setFailure('')
    try {
      const values = await request<AdminOrderResponse[]>(ordersPath({ ...filters, userId }, range, 1, 100, true))
      downloadOrders(values.map(toOrder))
    } catch (error) {
      setFailure(error instanceof ApiError && error.code === 'order_export_too_large'
        ? '一次最多导出 10000 条订单，请缩小筛选范围。' : '订单导出失败，请稍后重试。')
    } finally { setExporting(false) }
  }
  return <>
    <PageHeader title="订单管理" description="查看和管理用户订单，跟踪支付状态、会员开通情况及异常订单。" />
    <div className="order-management">
      <OrderStats stats={data?.stats} range={range} exceptionsSelected={filters.exceptionOnly} onExceptions={showExceptions} />
      <section className="order-list" aria-label="会员购买订单" aria-busy={!data && !failure}>
        <OrderFilters values={filters} onChange={changeFilters} range={range} onRange={changeRange} searchRef={searchRef}
          canExport={!!data?.total && !exporting} onExport={() => void exportOrders()} />
        <div className="order-live-feedback" role={failure ? 'alert' : 'status'}>
          <span>{failure || (exporting ? '正在导出订单…' : !data ? '正在读取订单…' : '每 15 秒自动刷新')}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setReload(value => value + 1)}>刷新订单</Button>
        </div>
        {filters.exceptionOnly && <div className="order-exception-filter" role="status">
          <CircleAlert size={17} aria-hidden="true" /><strong>异常订单</strong><span>当前正在查看支付成功但会员未开通的待处理订单</span>
          <Button type="button" variant="ghost" size="sm" aria-label="清除异常订单筛选"
            onClick={() => changeFilters({ ...filters, exceptionOnly: false, status: 'all' })}><X size={15} aria-hidden="true" />清除</Button>
        </div>}
        {userId && <div className="order-user-filter" role="status">当前用户订单 · {userEmail ?? userId}
          <Button type="button" variant="ghost" size="sm" onClick={clearUserFilter}>查看全部订单</Button>
        </div>}
        {data && <OrderTable orders={orders} onDetails={openDetail} onClearFilters={clearFilters} exceptionOnly={filters.exceptionOnly} />}
        <ListPagination total={data?.total ?? 0} page={page} pageCount={pageCount} pageSize={pageSize} countLabel="条订单" navigationLabel="订单列表分页"
          onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1) }} />
        {detailId && !detail && <div className="order-live-feedback" role={detailFailure ? 'alert' : 'status'}>
          {detailFailure || '正在读取订单详情…'}<Button variant="ghost" onClick={() => setDetailId(null)}>关闭</Button>
        </div>}
      </section>
    </div>
    <OrderDetail key={detailId ?? 'closed'} order={detail} onClose={() => { setDetailId(null); setDetail(null) }} onHandle={handleException}
      restoreFocus={() => { if (detailTrigger.current?.isConnected) detailTrigger.current.focus(); else searchRef.current?.focus() }} />
  </>
}
