export type PlanId = 'monthly' | 'annual' | 'lifetime'
export interface PlanConfig {
  id: PlanId; priceCents: number; durationDays: number | null; recommended: boolean; available: boolean
  version: number; updatedAtUtc: string
}
export interface PlanResponse {
  id: PlanId; name: string; amountFen: number; durationDays: number | null; recommended: boolean; available: boolean
  version: number; updatedAtUtc: string; currency: 'CNY'
}
export const planDetails: Record<PlanId, { name: string }> = {
  monthly: { name: '月会员' }, annual: { name: '年会员' }, lifetime: { name: '永久会员' },
}
export const toPlan = (plan: PlanResponse): PlanConfig => ({ ...plan, priceCents: plan.amountFen })
export interface PlanDraft { price: string; duration: string; recommended: boolean; available: boolean }
export type PlanErrors = Partial<Record<'price' | 'duration', string>>
export interface PlanChange { label: string; before: string; after: string }
const formatWhole = new Intl.NumberFormat('zh-CN').format
const formatDateTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
})
export const formatPlanUpdatedAt = (value?: string) => value ? formatDateTime.format(new Date(value)) : '—'
const decimalParts = (cents: number) => [Math.floor(cents / 100), String(cents % 100).padStart(2, '0')] as const
export function formatPlanPrice(cents: number) { const [whole, fraction] = decimalParts(cents); return `¥${formatWhole(whole)}.${fraction}` }
export const formatPlanDuration = (days: number | null) => days === null ? '永久有效' : `${days} 天`
export const saleStatus = (available: boolean) => available ? '上架中' : '已下架'
export function createPlanDraft(plan: PlanConfig): PlanDraft {
  return { price: decimalParts(plan.priceCents).join('.'), duration: plan.durationDays === null ? '' : String(plan.durationDays),
    recommended: plan.recommended, available: plan.available }
}
function parsePrice(input: string) {
  const text = input.trim()
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100000000 ? cents : null
}
export function validatePlanDraft(plan: PlanConfig, draft: PlanDraft): { value: PlanConfig } | { errors: PlanErrors } {
  const priceCents = parsePrice(draft.price)
  const days = /^\d+$/.test(draft.duration.trim()) ? Number(draft.duration.trim()) : NaN
  const errors: PlanErrors = {}
  if (priceCents === null) errors.price = '请输入大于 0、最多 100 万元的价格，最多保留两位小数。'
  if (plan.id !== 'lifetime' && (!Number.isSafeInteger(days) || days < 1 || days > 36500)) errors.duration = '请输入 1–36500 的整数天数。'
  if (priceCents === null || errors.duration) return { errors }
  return { value: { ...plan, priceCents, durationDays: plan.id === 'lifetime' ? null : days,
    recommended: draft.recommended, available: draft.available } }
}
export function getPlanChanges(before: PlanConfig, after: PlanConfig): PlanChange[] {
  const changes: PlanChange[] = []
  if (before.priceCents !== after.priceCents) changes.push({ label: '套餐价格', before: formatPlanPrice(before.priceCents), after: formatPlanPrice(after.priceCents) })
  if (before.durationDays !== after.durationDays) changes.push({ label: '有效期', before: formatPlanDuration(before.durationDays), after: formatPlanDuration(after.durationDays) })
  if (before.recommended !== after.recommended) changes.push({ label: '官网推荐', before: before.recommended ? '开启' : '关闭', after: after.recommended ? '开启' : '关闭' })
  if (before.available !== after.available) changes.push({ label: '销售状态', before: saleStatus(before.available), after: saleStatus(after.available) })
  return changes
}
