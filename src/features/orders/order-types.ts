export type Plan = 'monthly' | 'annual' | 'lifetime'
export type PaymentStatus = 'paid' | 'pending' | 'closed' | 'refunding' | 'refunded'
export type PaymentMethod = 'wechat' | 'alipay'
export type ActivationStatus = 'activated' | 'processing' | 'failed' | 'notStarted' | 'revoked'
export interface OrderEvent {
  id: string; occurredAt: string; message: string
  title?: string; status?: 'success' | 'failed' | 'processing' | 'neutral' | 'closed' | 'recorded' | 'revoked'; sortOrder?: number
}
export interface OrderRefundReceipt {
  id: string; amountFen: number; reasonCode: string; note: string | null; revokeMembership: boolean; membershipRevoked: boolean
  status: 'refunded' | 'refunding'; providerReference: string; createdAtUtc: string; completedAtUtc: string
}
export interface OrderRefundInfo {
  deadlineAtUtc: string | null; eligible: boolean; supported: boolean; canRevokeMembership: boolean
  blockReason: string | null; receipt: OrderRefundReceipt | null
}
export interface Order {
  id: string; orderId: string; userId: string; email: string; plan: Plan; amountCents: number
  payment: { method: PaymentMethod; status: PaymentStatus; completedAt: string | null; paidAtUtc?: string | null }
  activation: ActivationStatus; activatedAt: string | null; grantId: string | null; createdAt: string
  membership: { startsOn: string; expiresOn: string | null; expiresAtUtc: string | null } | null
  exception: { reason: string; occurredAt: string; code: string; detail: string } | null
  handledAt: string | null
  processingLog: OrderEvent[]
  transactionId?: string | null
  paymentProvider?: string | null
  refundedAmountCents?: number | null
  refundedAt?: string | null
  refund?: OrderRefundInfo | null
  clock?: { serverTimeUtc: string; receivedAt: number }
}
export const plans: Record<Plan, { label: string }> = {
  monthly: { label: '月会员' }, annual: { label: '年会员' }, lifetime: { label: '永久会员' },
}
export const paymentMethods: Record<PaymentMethod, string> = { wechat: '微信支付', alipay: '支付宝' }
export const paymentStatuses: Record<PaymentStatus, string> = { paid: '已支付', pending: '待支付', closed: '已关闭', refunding: '退款中', refunded: '已退款' }
export const activationStatuses: Record<ActivationStatus, string> = { activated: '已发放', processing: '待发放', failed: '发放失败', notStarted: '—', revoked: '已撤销' }
