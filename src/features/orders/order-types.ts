export type Plan = 'monthly' | 'annual' | 'lifetime'
export type PaymentStatus = 'paid' | 'pending' | 'closed'
export type PaymentMethod = 'wechat' | 'alipay'
export type ActivationStatus = 'activated' | 'processing' | 'failed' | 'notStarted'
export interface Order {
  id: string; orderId: string; userId: string; email: string; plan: Plan; amountCents: number
  payment: { method: PaymentMethod; status: PaymentStatus; completedAt: string | null }
  activation: ActivationStatus; activatedAt: string | null; grantId: string | null; createdAt: string
  membership: { startsOn: string; expiresOn: string | null; expiresAtUtc: string | null } | null
  exception: { reason: string; occurredAt: string; code: string; detail: string } | null
  handledAt: string | null
  processingLog: { id: string; occurredAt: string; message: string }[]
}
export const plans: Record<Plan, { label: string }> = {
  monthly: { label: '月会员' }, annual: { label: '年会员' }, lifetime: { label: '永久会员' },
}
export const paymentMethods: Record<PaymentMethod, string> = { wechat: '微信支付', alipay: '支付宝' }
export const paymentStatuses: Record<PaymentStatus, string> = { paid: '已支付', pending: '待支付', closed: '已关闭' }
export const activationStatuses: Record<ActivationStatus, string> = { activated: '已开通', processing: '开通中', failed: '开通失败', notStarted: '未开通' }
