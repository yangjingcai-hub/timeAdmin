import type { AccountStatus, Membership } from './user-types'

export const formatUserCount = new Intl.NumberFormat('zh-CN').format
export const accountLabels: Record<AccountStatus, string> = { active: '正常', disabled: '已禁用', deleted: '已注销', locked: '暂时锁定' }

const planLabels: Record<Membership['plan'], string> = { monthly: '月会员', annual: '年会员', lifetime: '永久会员' }

export function membershipPlan(membership: Membership | null) {
  return membership ? planLabels[membership.plan] : '—'
}

export function membershipExpiry(membership: Membership | null) {
  if (!membership) return '—'
  return membership.plan === 'lifetime' ? '永久有效' : membership.expiresOn
}
