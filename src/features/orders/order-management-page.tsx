import { useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { ListPagination } from '@/components/ui/list-controls'
import type { Order } from './mock-orders'
import { OrderDetail } from './order-detail'
import { OrderFilters, OrderRangeSelect } from './order-filters'
import { defaultOrderFilters, downloadOrders, filterOrders, getOrderStats, ordersInRange, type OrderFilters as FilterValues, type OrderRange } from './order-model'
import { OrderStats } from './order-stats'
import { OrderTable } from './order-table'
import './orders.css'

export function OrderManagementPage() {
  const [range, setRange] = useState<OrderRange>('all')
  const [filters, setFilters] = useState(defaultOrderFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [orderDetail, setOrderDetail] = useState<Order | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null)

  const rangeOrders = useMemo(() => ordersInRange(range), [range])
  const stats = useMemo(() => getOrderStats(rangeOrders, range), [rangeOrders, range])
  const matching = useMemo(() => filterOrders(rangeOrders, filters), [rangeOrders, filters])
  const pageCount = Math.ceil(matching.length / pageSize)
  const visibleOrders = matching.slice((page - 1) * pageSize, page * pageSize)

  function changeRange(next: OrderRange) {
    setRange(next)
    setPage(1)
  }

  function changeFilters(next: FilterValues) {
    setFilters(next)
    setPage(1)
  }

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  function openDetail(order: Order, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger
    setOrderDetail(order)
  }

  return (
    <>
      <PageHeader title="订单管理" description="查询和追踪会员购买订单，查看支付状态与会员开通情况。"
        actions={<OrderRangeSelect range={range} onChange={changeRange} />} />
      <div className="order-management">
        <OrderStats stats={stats} range={range} />
        <section className="order-list" aria-label="会员购买订单">
          <OrderFilters values={filters} onChange={changeFilters} canExport={matching.length > 0} onExport={() => downloadOrders(matching)} />
          <OrderTable orders={visibleOrders} onDetails={openDetail} onClearFilters={() => changeFilters(defaultOrderFilters)} />
          <ListPagination total={matching.length} page={page} pageCount={pageCount} pageSize={pageSize} countLabel="条订单" navigationLabel="订单列表分页"
            onPageChange={setPage} onPageSizeChange={changePageSize} />
        </section>
      </div>
      <OrderDetail order={orderDetail} onClose={() => setOrderDetail(null)} restoreFocus={() => detailTrigger.current?.focus()} />
    </>
  )
}
