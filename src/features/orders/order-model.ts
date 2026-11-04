import { activationStatuses, historyDays, mockOrders, orderSnapshot, paymentMethods, paymentStatuses, plans, type Order, type PaymentMethod, type PaymentStatus, type Plan } from './mock-orders'

export type OrderRange = 'all' | 'week' | 'month' | 'quarter'

export const orderRanges: Record<OrderRange, { label: string; days: number }> = {
  all: { label: '全部时间', days: historyDays },
  week: { label: '最近 7 天', days: 7 },
  month: { label: '最近 30 天', days: 30 },
  quarter: { label: '最近 90 天', days: 90 },
}

export interface OrderFilters {
  query: string
  status: 'all' | PaymentStatus
  plan: 'all' | Plan
  method: 'all' | PaymentMethod
}

export const defaultOrderFilters: OrderFilters = { query: '', status: 'all', plan: 'all', method: 'all' }

const formatCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format
export const formatOrderCount = new Intl.NumberFormat('zh-CN').format
export const formatOrderShare = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 }).format

export function formatAmount(cents: number) {
  return formatCurrency(cents / 100)
}

export function ordersInRange(range: OrderRange) {
  if (range === 'all') return mockOrders

  const cutoff = new Date(orderSnapshot - (orderRanges[range].days - 1) * 86_400_000).toISOString().slice(0, 10)
  return mockOrders.filter((order) => order.createdAt >= cutoff)
}

export function filterOrders(orders: Order[], filters: OrderFilters) {
  const query = filters.query.trim().toLowerCase()

  return orders.filter((order) => {
    if (query && !order.id.toLowerCase().includes(query) && !order.email.toLowerCase().includes(query)) return false
    if (filters.status !== 'all' && order.payment.status !== filters.status) return false
    if (filters.plan !== 'all' && order.plan !== filters.plan) return false
    return filters.method === 'all' || order.payment.method === filters.method
  })
}

type Metric = 'total' | PaymentStatus
const metrics: Metric[] = ['total', 'paid', 'pending', 'closed']

export function getOrderStats(orders: Order[], range: OrderRange) {
  const counts = { total: orders.length, paid: 0, pending: 0, closed: 0 }
  const trends = { total: Array<number>(7).fill(0), paid: Array<number>(7).fill(0), pending: Array<number>(7).fill(0), closed: Array<number>(7).fill(0) }
  const days = orderRanges[range].days

  for (const order of orders) {
    const daysAgo = (orderSnapshot - Date.parse(`${order.createdAt.slice(0, 10)}T00:00:00Z`)) / 86_400_000
    const bucket = Math.max(0, Math.min(6, Math.floor((days - 1 - daysAgo) * 7 / days)))
    counts[order.payment.status] += 1
    trends.total[bucket] += 1
    trends[order.payment.status][bucket] += 1
  }

  return metrics.map((key) => ({ key, count: counts[key], share: counts.total ? counts[key] / counts.total : 0, trend: trends[key] }))
}

export function downloadOrders(orders: Order[]) {
  const headers = ['订单编号', '用户邮箱', '会员套餐', '订单金额（元）', '支付方式', '支付状态', '会员开通状态', '创建时间', '支付完成时间']
  const rows = orders.map((order) => [
    order.id, order.email, plans[order.plan].label, (order.amountCents / 100).toFixed(2), paymentMethods[order.payment.method],
    paymentStatuses[order.payment.status], activationStatuses[order.activation], order.createdAt, order.payment.completedAt ?? '',
  ])
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'focustime-orders.csv'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
