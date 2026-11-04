type PlanId = 'monthly' | 'yearly' | 'lifetime'

interface PlanFields {
  priceCents: number
  recommended: boolean
  available: boolean
}

export type PlanConfig = PlanFields & (
  | { id: 'monthly' | 'yearly'; durationDays: number }
  | { id: 'lifetime'; durationDays: null }
)

export const planDetails: Record<PlanId, { name: string; description: string }> = {
  monthly: { name: '月会员', description: '适合短期使用，灵活体验会员功能' },
  yearly: { name: '年会员', description: '性价比更高，享受完整会员体验' },
  lifetime: { name: '永久会员', description: '一次购买，永久享受会员权益' },
}

const defaultPlans: PlanConfig[] = [
  { id: 'monthly', priceCents: 2_800, durationDays: 30, recommended: false, available: true },
  { id: 'yearly', priceCents: 19_800, durationDays: 365, recommended: true, available: true },
  { id: 'lifetime', priceCents: 39_800, durationDays: null, recommended: false, available: true },
]

export interface PlanDraft {
  price: string
  duration: string
  recommended: boolean
  available: boolean
}

export type PlanErrors = Partial<Record<'price' | 'duration', string>>

export interface PlanChange {
  label: string
  before: string
  after: string
}

const storageKey = 'focustime-admin:mock-plans:v1'
const formatWhole = new Intl.NumberFormat('zh-CN').format

function decimalParts(cents: number) {
  return [Math.floor(cents / 100), String(cents % 100).padStart(2, '0')] as const
}

export function formatPlanPrice(cents: number) {
  const [whole, fraction] = decimalParts(cents)
  return `¥${formatWhole(whole)}.${fraction}`
}

export function formatPlanDuration(days: number | null) {
  return days === null ? '永久有效' : `${days} 天`
}

export function saleStatus(available: boolean) {
  return available ? '上架中' : '已下架'
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function readPlans(): PlanConfig[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return defaultPlans

    const byId = stored as Partial<Record<PlanId, Partial<PlanConfig>>>
    return defaultPlans.map((plan) => {
      const saved = byId[plan.id]
      if (!saved) return plan

      const fields = {
        priceCents: isPositiveInteger(saved.priceCents) ? saved.priceCents : plan.priceCents,
        recommended: typeof saved.recommended === 'boolean' ? saved.recommended : plan.recommended,
        available: typeof saved.available === 'boolean' ? saved.available : plan.available,
      }
      return plan.id === 'lifetime'
        ? { ...plan, ...fields }
        : { ...plan, ...fields, durationDays: isPositiveInteger(saved.durationDays) ? saved.durationDays : plan.durationDays }
    })
  } catch {
    return defaultPlans
  }
}

export function storePlans(plans: PlanConfig[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(plans.map((plan) => [plan.id, plan]))))
  } catch {
    // The current page can still use its in-memory copy.
  }
}

export function createPlanDraft(plan: PlanConfig): PlanDraft {
  return {
    price: decimalParts(plan.priceCents).join('.'),
    duration: plan.durationDays === null ? '' : String(plan.durationDays),
    recommended: plan.recommended,
    available: plan.available,
  }
}

function parsePrice(input: string) {
  const text = input.trim()
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) return null

  const [whole, fraction = ''] = text.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return isPositiveInteger(cents) ? cents : null
}

export function validatePlanDraft(plan: PlanConfig, draft: PlanDraft): { value: PlanConfig } | { errors: PlanErrors } {
  const priceCents = parsePrice(draft.price)
  const duration = draft.duration.trim()
  const days = /^\d+$/.test(duration) ? Number(duration) : NaN
  const errors: PlanErrors = {}
  if (priceCents === null) errors.price = '请输入大于 0 的价格，最多保留两位小数。'
  if (plan.id !== 'lifetime' && !isPositiveInteger(days)) errors.duration = '请输入大于 0 的整数天数。'
  if (priceCents === null || errors.duration) return { errors }

  const fields = { priceCents, recommended: draft.recommended, available: draft.available }
  return { value: plan.id === 'lifetime' ? { ...plan, ...fields } : { ...plan, ...fields, durationDays: days } }
}

export function getPlanChanges(before: PlanConfig, after: PlanConfig): PlanChange[] {
  const changes: PlanChange[] = []
  if (before.priceCents !== after.priceCents) changes.push({ label: '套餐价格', before: formatPlanPrice(before.priceCents), after: formatPlanPrice(after.priceCents) })
  if (before.durationDays !== after.durationDays) changes.push({ label: '有效期', before: formatPlanDuration(before.durationDays), after: formatPlanDuration(after.durationDays) })
  if (before.recommended !== after.recommended) changes.push({ label: '官网推荐', before: before.recommended ? '开启' : '关闭', after: after.recommended ? '开启' : '关闭' })
  if (before.available !== after.available) changes.push({ label: '销售状态', before: saleStatus(before.available), after: saleStatus(after.available) })
  return changes
}
