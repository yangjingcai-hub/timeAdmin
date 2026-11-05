import { activationStatuses, paymentMethods, paymentStatuses, plans, type Order, type PaymentMethod, type PaymentStatus, type Plan } from './order-types'
export type OrderRange = 'all' | 'week' | 'month' | 'quarter'
export const orderRanges: Record<OrderRange, { label: string }> = {
  all: { label: '全部时间' }, week: { label: '最近 7 天' }, month: { label: '最近 30 天' }, quarter: { label: '最近 90 天' },
}
export interface OrderFilters {
  query: string; status: 'all' | PaymentStatus; plan: 'all' | Plan; method: 'all' | PaymentMethod
  exceptionOnly: boolean; userId: string
}
export const defaultOrderFilters: OrderFilters = { query: '', status: 'all', plan: 'all', method: 'all', exceptionOnly: false, userId: '' }
export const isOrderException = (order: Order) => order.payment.status === 'paid' && order.activation !== 'activated'
const formatCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format
export const formatOrderCount = new Intl.NumberFormat('zh-CN').format
export const formatOrderShare = new Intl.NumberFormat('zh-CN', { style: 'percent', maximumFractionDigits: 1 }).format
export const formatAmount = (cents: number) => formatCurrency(cents / 100)
export function remainingMembershipDays(order: Order) {
  if (!order.membership?.expiresAtUtc) return null
  return Math.max(0, Math.ceil((Date.parse(order.membership.expiresAtUtc) - Date.now()) / 86400000))
}
export function formatOrderLogTime(value: string) {
  if (!value.includes('T')) return value
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}
export function downloadOrders(orders: Order[]) {
  const headers = ['订单编号', '用户邮箱', '会员套餐', '订单金额（元）', '支付方式', '支付状态', '会员开通状态', '创建时间', '支付完成时间', '会员开通时间', '异常原因']
  const rows = orders.map(order => [order.id, order.email, plans[order.plan].label, (order.amountCents / 100).toFixed(2),
    paymentMethods[order.payment.method], paymentStatuses[order.payment.status], activationStatuses[order.activation],
    order.createdAt, order.payment.completedAt ?? '', order.activatedAt ?? '', order.exception?.reason ?? ''])
  const csv = [headers, ...rows].map(row => row.map(cell => {
    const safe = /^[=+@\-\t\r]/.test(cell) ? "'" + cell : cell
    return `"${safe.replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'focustime-orders.csv'; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
