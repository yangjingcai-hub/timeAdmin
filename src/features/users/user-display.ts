import type { AccountStatus, Membership } from './user-types'

export const formatUserCount = new Intl.NumberFormat('zh-CN').format
export const accountLabels: Record<AccountStatus, string> = { active: '正常', disabled: '已禁用', deleted: '已注销', locked: '暂时锁定' }

const planLabels: Record<Membership['plan'], string> = {
  trial: '体验会员', monthly: '月会员', annual: '年会员', lifetime: '永久会员',
}

export function membershipPlanLabel(plan: string | null | undefined) {
  if (!plan) return '—'
  return Object.hasOwn(planLabels, plan) ? planLabels[plan as Membership['plan']] : plan
}

export function membershipPlan(membership: Membership | null) {
  return membershipPlanLabel(membership?.plan)
}

export function membershipExpiry(membership: Membership | null) {
  if (!membership) return '—'
  return membership.plan === 'lifetime' ? '永久有效' : membership.expiresOn
}
