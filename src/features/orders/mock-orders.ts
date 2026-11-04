export type Plan = 'monthly' | 'yearly' | 'lifetime'
export type PaymentStatus = 'paid' | 'pending' | 'closed'
export type PaymentMethod = 'wechat' | 'alipay' | 'card'
export type ActivationStatus = 'activated' | 'processing' | 'failed' | 'notStarted'

export interface Order {
  id: string
  email: string
  plan: Plan
  amountCents: number
  payment: { method: PaymentMethod; status: PaymentStatus; completedAt: string | null }
  activation: ActivationStatus
  createdAt: string
}

export const plans = {
  monthly: { label: '月会员', amountCents: 2_800 },
  yearly: { label: '年会员', amountCents: 19_800 },
  lifetime: { label: '永久会员', amountCents: 39_800 },
} satisfies Record<Plan, { label: string; amountCents: number }>

export const paymentMethods: Record<PaymentMethod, string> = { wechat: '微信支付', alipay: '支付宝', card: '银行卡' }
export const paymentStatuses: Record<PaymentStatus, string> = { paid: '已支付', pending: '待支付', closed: '已关闭' }
export const activationStatuses: Record<ActivationStatus, string> = { activated: '已开通', processing: '开通中', failed: '开通失败', notStarted: '未开通' }

const dayMs = 86_400_000
export const orderSnapshot = Date.UTC(2026, 10, 4)
export const historyDays = 120

const referenceOrders = [
  ['FT202611040328', 'yearly', 'paid', '11-04 14:20', '11-04 14:22'],
  ['FT202611040327', 'monthly', 'pending', '11-04 13:56', null],
  ['FT202611040326', 'lifetime', 'paid', '11-04 11:42', '11-04 11:44'],
  ['FT202611040325', 'yearly', 'closed', '11-04 10:20', null],
  ['FT202611030318', 'monthly', 'paid', '11-03 20:16', '11-03 20:18'],
  ['FT202611030317', 'yearly', 'paid', '11-03 18:07', '11-03 18:09'],
  ['FT202611030316', 'monthly', 'pending', '11-03 15:21', null],
  ['FT202611020315', 'yearly', 'paid', '11-02 21:30', '11-02 21:31'],
  ['FT202611020314', 'lifetime', 'paid', '11-02 16:12', '11-02 16:14'],
  ['FT202611020313', 'monthly', 'closed', '11-02 14:05', null],
] as const satisfies readonly [string, Plan, PaymentStatus, string, string | null][]

const channels = Object.keys(paymentMethods) as PaymentMethod[]
const planIds = Object.keys(plans) as Plan[]
const totalOrders = 3_205
const generatedCount = totalOrders - referenceOrders.length
const pendingCount = 286 - referenceOrders.filter((row) => row[2] === 'pending').length
const closedCount = 186 - referenceOrders.filter((row) => row[2] === 'closed').length
const unpaidCount = pendingCount + closedCount

function mockPaymentStatus(index: number): PaymentStatus {
  const priorUnpaid = Math.floor(index * unpaidCount / generatedCount)
  const currentUnpaid = Math.floor((index + 1) * unpaidCount / generatedCount)
  if (currentUnpaid === priorUnpaid) return 'paid'

  return Math.floor(currentUnpaid * pendingCount / unpaidCount) > Math.floor(priorUnpaid * pendingCount / unpaidCount) ? 'pending' : 'closed'
}

function fixtureTime(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ')
}

export const mockOrders: Order[] = Array.from({ length: totalOrders }, (_, index) => {
  const email = `user${String(index + 1).padStart(2, '0')}@example.com`
  const method = channels[index % channels.length]
  const reference = referenceOrders[index]
  if (reference) {
    const [id, plan, status, createdAt, completedAt] = reference
    return {
      id, email, plan, amountCents: plans[plan].amountCents, createdAt: `2026-${createdAt}`,
      payment: { method, status, completedAt: completedAt ? `2026-${completedAt}` : null },
      activation: status === 'paid' ? 'activated' : 'notStarted',
    }
  }

  const offset = index - referenceOrders.length
  const daysAgo = 3 + (offset / generatedCount) ** 1.24 * (historyDays - 3)
  const time = orderSnapshot - daysAgo * dayMs + 21 * 3_600_000
  const createdAt = fixtureTime(time)
  const id = `FT${createdAt.slice(0, 10).replaceAll('-', '')}${String(totalOrders - index).padStart(4, '0')}`
  const plan = planIds[offset % planIds.length]
  const status = mockPaymentStatus(offset)
  const activation = status !== 'paid' ? 'notStarted' : offset % 61 === 0 ? 'processing' : offset % 83 === 0 ? 'failed' : 'activated'

  return {
    id, email, plan, amountCents: plans[plan].amountCents, createdAt, activation,
    payment: { method, status, completedAt: status === 'paid' ? fixtureTime(time + 120_000) : null },
  }
})
