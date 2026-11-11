import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { CircleAlert, RefreshCw, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import type { Order } from './order-types'
import { ordersPath, toOrder, type AdminOrderResponse, type OrdersPage, type OrderStat } from './order-api'
import { OrderDetail } from './order-detail'
import { OrderFilters } from './order-filters'
import { defaultOrderFilters, downloadOrders, type OrderFilters as FilterValues, type OrderRange } from './order-model'
import { OrderStats } from './order-stats'
import { OrderTable } from './order-table'
import './orders.css'

const pageSize = 10

export function OrderManagementPage() {
  const { request } = useAdminAuth()
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState<OrderRange>('all')
  const [filters, setFilters] = useState(defaultOrderFilters)
  const [requestedPage, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)
  const [detailResult, setDetailResult] = useState<{ id: string; data: Order } | null>(null)
  const [detailFailure, setDetailFailure] = useState<{ id: string; message: string } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailAttempt, setDetailAttempt] = useState(0)
  const [result, setResult] = useState<{ path: string; range: OrderRange; userId: string; data: OrdersPage } | null>(null)
  const [failure, setFailure] = useState('')
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)
  const [exporting, setExporting] = useState(false)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dataVersion = useRef(0)
  const userId = params.get('userId') ?? ''
  const path = ordersPath({ ...filters, userId }, range, requestedPage, pageSize)
  const data = result?.path === path ? result.data : undefined
  const orders = data?.items.map(toOrder) ?? []
  const page = data?.page ?? requestedPage
  const pageCount = Math.ceil((data?.total ?? 0) / pageSize)
  const detailId = params.get('orderId')
  const detail = detailResult?.id === detailId ? detailResult.data : selected?.orderId === detailId ? selected : null
  const detailError = detailFailure?.id === detailId ? detailFailure.message : ''
  const stats = result?.range === range && result.userId === userId ? result.data.stats : undefined
  const selectedStat = filters.exceptionOnly ? 'exceptions' : filters.status === 'all' ? 'total'
    : filters.status === 'paid' || filters.status === 'refunded' ? filters.status : null

  useEffect(() => {
    const controller = new AbortController()
    const version = dataVersion.current
    setFailure(''); setLoading(true)
    request<OrdersPage>(path, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted && version === dataVersion.current) setResult({ path, range, userId, data: value })
    }).catch(() => {
      if (!controller.signal.aborted && version === dataVersion.current) setFailure('订单读取失败，请检查后台服务后重试。')
    }).finally(() => { if (!controller.signal.aborted && version === dataVersion.current) setLoading(false) })
    return () => controller.abort()
  }, [path, range, userId, request, reload])

  useEffect(() => {
    if (!detailId) return
    const controller = new AbortController()
    const version = dataVersion.current
    setDetailLoading(true); setDetailFailure(null)
    request<AdminOrderResponse>(`/api/v1/admin/orders/${encodeURIComponent(detailId)}`, { signal: controller.signal }).then(value => {
      if (value.order.id.toLowerCase() !== detailId.toLowerCase()) throw new Error('Unexpected order identity')
      if (!controller.signal.aborted && version === dataVersion.current) setDetailResult({ id: detailId, data: toOrder(value) })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && version === dataVersion.current) setDetailFailure({ id: detailId,
        message: error instanceof ApiError && error.status === 404 ? '订单不存在或已被移除。' : '订单详情读取失败，请重试。' })
    }).finally(() => { if (!controller.signal.aborted && version === dataVersion.current) setDetailLoading(false) })
    return () => controller.abort()
  }, [detailId, request, detailAttempt, reload])

  function clearUserFilter() {
    const next = new URLSearchParams(params); next.delete('userId'); setParams(next, { replace: true }); setPage(1)
  }
  function changeRange(next: OrderRange) { setRange(next); setPage(1) }
  function changeFilters(next: FilterValues) { setFilters(next); setPage(1) }
  function clearFilters() { changeFilters(defaultOrderFilters); changeRange('all'); clearUserFilter() }
  function selectStat(key: OrderStat['key']) {
    if (key === 'total') { clearFilters(); return }
    changeFilters({ ...filters, status: key === 'refunded' ? 'refunded' : 'paid', exceptionOnly: key === 'exceptions' })
  }
  function openDetail(order: Order, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger
    setDetailResult(null); setDetailFailure(null); setDetailLoading(true); setSelected(order)
    const next = new URLSearchParams(params); next.set('orderId', order.orderId); setParams(next, { replace: true })
  }
  function closeDetail() {
    setSelected(null); setDetailResult(null); setDetailFailure(null)
    const next = new URLSearchParams(params); next.delete('orderId'); setParams(next, { replace: true })
  }
  function applyRefund(value: AdminOrderResponse) {
    dataVersion.current += 1
    const updated = toOrder(value)
    setDetailResult({ id: updated.orderId, data: updated }); setSelected(updated); setDetailFailure(null); setDetailLoading(false)
    setResult(current => current ? { ...current, data: { ...current.data, items: current.data.items.map(item => item.order.id === value.order.id ? value : item) } } : current)
    setReload(current => current + 1)
  }
  async function exportOrders() {
    if (exporting) return
    setExporting(true)
    try {
      const values = await request<AdminOrderResponse[]>(ordersPath({ ...filters, userId }, range, 1, 100, true))
      downloadOrders(values.map(toOrder))
    } catch (error) {
      setFailure(error instanceof ApiError && error.code === 'order_export_too_large'
        ? '一次最多导出 10000 条订单，请缩小筛选范围。' : '订单导出失败，请稍后重试。')
    } finally { setExporting(false) }
  }

  return <>
    <PageHeader className="order-page-heading" title="订单管理" description="查看和管理用户订单，跟踪订单状态、会员权益及异常订单。"
      actions={<Button type="button" variant="ghost" size="sm" className="order-refresh-button" disabled={loading} onClick={() => setReload(value => value + 1)}>
        <RefreshCw size={15} className={loading ? 'order-refresh-spinning' : undefined} aria-hidden="true" />{loading ? '刷新中…' : '刷新订单'}
      </Button>} />
    <div className="order-management">
      <OrderStats stats={stats} selected={selectedStat} onSelect={selectStat} />
      <section className="order-list" aria-label="会员购买订单" aria-busy={loading}>
        <OrderFilters values={filters} onChange={changeFilters} range={range} onRange={changeRange} searchRef={searchRef}
          canExport={!!data?.total && !exporting} onExport={() => void exportOrders()} />
        {(failure || exporting || (loading && !data)) && <p className="order-live-feedback" role={failure ? 'alert' : 'status'}>
          {failure || (exporting ? '正在导出订单…' : '正在读取订单…')}
        </p>}
        {filters.exceptionOnly && <div className="order-exception-filter" role="status">
          <CircleAlert size={17} aria-hidden="true" /><strong>待处理异常</strong><span>支付成功但权益尚未发放的订单</span>
          <Button type="button" variant="ghost" size="sm" aria-label="清除异常订单筛选"
            onClick={() => changeFilters({ ...filters, exceptionOnly: false, status: 'all' })}><X size={15} aria-hidden="true" />清除</Button>
        </div>}
        {userId && <div className="order-user-filter" role="status">当前用户订单 · {orders.find(order => order.userId === userId)?.email ?? userId}
          <Button type="button" variant="ghost" size="sm" onClick={clearUserFilter}>查看全部订单</Button>
        </div>}
        {data && <div className="order-list-frame">
          <OrderTable orders={orders} onDetails={openDetail} onClearFilters={clearFilters} exceptionOnly={filters.exceptionOnly} />
          <ListPagination total={data.total} page={page} pageCount={pageCount} countLabel="条订单" navigationLabel="订单列表分页" onPageChange={setPage} />
        </div>}
      </section>
    </div>
    {detailId && <OrderDetail key={detailId} order={detail} loading={detailLoading || (!detail && !detailError)} error={detailError}
      onRefunded={applyRefund}
      onRetry={() => setDetailAttempt(value => value + 1)} onRefresh={() => setReload(value => value + 1)} onClose={closeDetail}
      restoreFocus={() => { if (detailTrigger.current?.isConnected) detailTrigger.current.focus(); else searchRef.current?.focus() }} />}
  </>
}
