import type { OrderFilters, OrderRange } from './order-model'
import type { ActivationStatus, Order, PaymentMethod, Plan } from './order-types'
export interface AdminOrderResponse {
  order: {
    id: string; orderNumber: string; plan: Plan; amountFen: number; currency: string; method: PaymentMethod
    status: 'pending' | 'paid' | 'expired'; createdAtUtc: string; expiresAtUtc: string; paidAtUtc: string | null
    activationStatus: ActivationStatus; activatedAtUtc: string | null; membershipGrantId: string | null
    activationErrorCode: string | null
  }
  userId: string; email: string
  membershipStartsAtUtc: string | null; membershipExpiresAtUtc: string | null; activationAttemptedAtUtc: string | null
  events: { id: string; kind: string; actor: string; occurredAtUtc: string }[]
}
export interface OrderStat { key: 'total' | 'paid' | 'exceptions'; count: number; share: number; trend: number[] }
export interface OrdersPage {
  items: AdminOrderResponse[]; total: number; page: number; pageSize: number; stats: OrderStat[]; serverTimeUtc: string
}
const dateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
})
const formatTime = (value: string) => dateTime.format(new Date(value))
const eventNames: Record<string, string> = {
  order_created: '订单已创建，等待支付。', payment_method_changed: '已更新支付方式。',
  payment_confirmed: '后端已确认模拟支付，未产生实际扣款。', membership_activated: '会员权益已开通并关联订单。',
  membership_activation_failed: '会员开通失败，支付记录已保留，等待重试。',
}
export function toOrder(data: AdminOrderResponse): Order {
  const order = data.order
  const exception = order.status === 'paid' && order.activationStatus !== 'activated'
  return {
    id: order.orderNumber, orderId: order.id, userId: data.userId, email: data.email, plan: order.plan,
    amountCents: order.amountFen, payment: { method: order.method, status: order.status === 'expired' ? 'closed' : order.status,
      completedAt: order.paidAtUtc ? formatTime(order.paidAtUtc) : null },
    activation: order.activationStatus, activatedAt: order.activatedAtUtc ? formatTime(order.activatedAtUtc) : null,
    grantId: order.membershipGrantId, createdAt: formatTime(order.createdAtUtc),
    membership: data.membershipStartsAtUtc ? { startsOn: formatTime(data.membershipStartsAtUtc).slice(0, 10),
      expiresOn: data.membershipExpiresAtUtc ? formatTime(data.membershipExpiresAtUtc).slice(0, 10) : null,
      expiresAtUtc: data.membershipExpiresAtUtc } : null,
    exception: exception ? { reason: order.activationStatus === 'failed' ? '会员开通失败' : '会员尚未开通',
      occurredAt: formatTime(data.activationAttemptedAtUtc || order.paidAtUtc || order.createdAtUtc),
      code: order.activationErrorCode || 'membership_activation_pending',
      detail: '后端已保存支付确认，但尚未完成本订单的会员发放。可以重试开通，重复操作不会增加会员时长。' } : null,
    handledAt: null,
    processingLog: data.events.map(event => ({ id: event.id, occurredAt: event.occurredAtUtc,
      message: eventNames[event.kind] || event.kind })),
  }
}
export function ordersPath(filters: OrderFilters, range: OrderRange, page = 1, pageSize = 10, exporting = false) {
  const query = new URLSearchParams({ query: filters.query, status: filters.status, plan: filters.plan,
    method: filters.method, exceptionOnly: String(filters.exceptionOnly), range, page: String(page), pageSize: String(pageSize) })
  if (filters.userId) query.set('userId', filters.userId)
  return `/api/v1/admin/orders${exporting ? '/export' : ''}?${query}`
}
