import type { OrderFilters, OrderRange } from './order-model'
import type { ActivationStatus, Order, OrderEvent, OrderRefundInfo, PaymentMethod, PaymentStatus, Plan } from './order-types'
export interface AdminOrderResponse {
  order: {
    id: string; orderNumber: string; plan: Plan; amountFen: number; currency: string; method: PaymentMethod
    status: PaymentStatus | 'expired'; createdAtUtc: string; expiresAtUtc: string; paidAtUtc: string | null
    activationStatus: ActivationStatus; activatedAtUtc: string | null; membershipGrantId: string | null
    activationErrorCode: string | null; serverTimeUtc?: string
  }
  userId: string; email: string
  membershipStartsAtUtc: string | null; membershipExpiresAtUtc: string | null; activationAttemptedAtUtc: string | null
  paymentProvider?: string | null; paymentReference?: string | null; membershipRevokedAtUtc?: string | null
  refund?: OrderRefundInfo | null
  events: { id: string; kind: string; actor: string; occurredAtUtc: string }[]
}
export interface OrderStat { key: 'total' | 'paid' | 'refunded' | 'exceptions'; count: number; share: number; trend: number[] }
export interface OrdersPage {
  items: AdminOrderResponse[]; total: number; page: number; pageSize: number; stats: OrderStat[]; serverTimeUtc: string
}
const dateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
})
const formatTime = (value: string) => dateTime.format(new Date(value))
const eventContent: Record<string, Pick<OrderEvent, 'title' | 'message' | 'status'>> = {
  order_created: { title: '订单创建', message: '用户发起购买，订单已创建。', status: 'recorded' },
  payment_confirmed: { title: '支付成功', message: '支付结果已确认，支付记录已保存。', status: 'success' },
  membership_activated: { title: '会员权益发放成功', message: '本订单的会员权益已发放。', status: 'success' },
  membership_activation_failed: { title: '会员权益发放失败', message: '会员权益未发放成功，支付记录已保留。', status: 'failed' },
  order_closed: { title: '订单已关闭', message: '订单超时未支付，系统已关闭。', status: 'closed' },
  refund_requested: { title: '退款申请已受理', message: '订单已进入退款处理流程。', status: 'processing' },
  refund_completed: { title: '退款成功', message: '退款已完成。', status: 'success' },
  membership_revoked: { title: '会员权益已撤销', message: '本订单对应的会员权益已撤销。', status: 'revoked' },
}
export function toOrder(data: AdminOrderResponse): Order {
  const order = data.order
  const events = data.events.filter(event => event.kind !== 'payment_method_changed')
  // The server derives expired orders from this exact payment deadline; no historical event is written.
  if (order.status === 'expired' && !events.some(event => event.kind === 'order_closed')) {
    events.push({ id: `expired:${order.id}`, kind: 'order_closed', actor: 'system', occurredAtUtc: order.expiresAtUtc })
  }
  const activation = data.membershipRevokedAtUtc ? 'revoked' : order.status === 'paid' && order.activationStatus === 'notStarted' ? 'processing' : order.activationStatus
  const exception = order.status === 'paid' && (activation === 'failed' || activation === 'processing')
  const refundedAt = data.events.filter(event => event.kind === 'refund_completed').sort((a, b) => Date.parse(b.occurredAtUtc) - Date.parse(a.occurredAtUtc))[0]?.occurredAtUtc
  return {
    id: order.orderNumber, orderId: order.id, userId: data.userId, email: data.email, plan: order.plan,
    amountCents: order.amountFen, payment: { method: order.method, status: order.status === 'expired' ? 'closed' : order.status,
      completedAt: order.paidAtUtc ? formatTime(order.paidAtUtc) : null, paidAtUtc: order.paidAtUtc },
    activation, activatedAt: order.activatedAtUtc ? formatTime(order.activatedAtUtc) : null,
    grantId: order.membershipGrantId, createdAt: formatTime(order.createdAtUtc),
    membership: data.membershipStartsAtUtc ? { startsOn: formatTime(data.membershipStartsAtUtc),
      expiresOn: data.membershipExpiresAtUtc ? formatTime(data.membershipExpiresAtUtc) : null,
      expiresAtUtc: data.membershipExpiresAtUtc } : null,
    exception: exception ? { reason: activation === 'failed' ? '会员权益发放失败' : '会员权益待发放',
      occurredAt: formatTime(data.activationAttemptedAtUtc || order.paidAtUtc || order.createdAtUtc),
      code: order.activationErrorCode || 'membership_activation_pending',
      detail: activation === 'failed' ? `后台已记录发放失败，错误代码：${order.activationErrorCode || '未知'}。` : '支付已确认，后台尚未完成本订单的权益发放。' } : null,
    handledAt: null, transactionId: data.paymentReference ?? null, paymentProvider: data.paymentProvider ?? null,
    refundedAmountCents: data.refund?.receipt?.amountFen ?? null,
    refundedAt: data.refund?.receipt?.completedAtUtc ? formatTime(data.refund.receipt.completedAtUtc) : refundedAt ? formatTime(refundedAt) : null,
    refund: data.refund,
    clock: order.serverTimeUtc ? { serverTimeUtc: order.serverTimeUtc, receivedAt: performance.now() } : undefined,
    processingLog: events.map(event => {
      const content = eventContent[event.kind] ?? { title: '订单处理事件', message: event.kind, status: 'neutral' as const }
      const retry = event.actor.startsWith('admin:') && (event.kind === 'membership_activated' || event.kind === 'membership_activation_failed')
      return { id: event.id, occurredAt: event.occurredAtUtc, ...content,
        sortOrder: ({ order_created: 0, payment_confirmed: 10, membership_activated: 20, refund_requested: 30, refund_completed: 40, membership_revoked: 50 } as Record<string, number>)[event.kind] ?? 0,
        ...(retry ? { title: event.kind === 'membership_activated' ? '权益重试发放成功' : '权益重试发放失败', message: '管理员重试发放，结果已由后台保存。' } : {}),
        ...(event.kind === 'payment_confirmed' && event.actor === 'simulation' ? { title: '模拟支付已确认', message: '开发环境的模拟支付记录，未产生实际扣款。' } : {}),
        ...(event.kind === 'refund_completed' && data.paymentProvider === 'simulation' ? { title: '模拟退款已确认', message: '模拟支付订单的退款已记录，未发生实际资金划转。' } : {}),
        ...(event.kind === 'membership_revoked' && event.actor.startsWith('admin-adjustment:') ? { message: '管理员已撤销本订单对应的会员权益，本次操作未发起退款。' } : {}),
      }
    }),
  }
}
export function ordersPath(filters: OrderFilters, range: OrderRange, page = 1, pageSize = 10, exporting = false) {
  const query = new URLSearchParams({ query: filters.query, status: filters.status, plan: filters.plan,
    method: filters.method, exceptionOnly: String(filters.exceptionOnly), range, page: String(page), pageSize: String(pageSize) })
  if (filters.userId) query.set('userId', filters.userId)
  return `/api/v1/admin/orders${exporting ? '/export' : ''}?${query}`
}
