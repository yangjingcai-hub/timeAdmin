export type AccountStatus = 'active' | 'disabled' | 'deleted' | 'locked'
export type Membership = { plan: 'monthly' | 'annual'; expiresOn: string } | { plan: 'lifetime' }
export interface User {
  id: string
  email: string
  membership: Membership | null
  registeredAt: string
  lastLoginAt: string | null
  status: AccountStatus
  lockedUntil: string | null
}
export const registrationRanges = {
  all: { label: '全部时间' }, today: { label: '今日' }, week: { label: '最近 7 天' },
  month: { label: '最近 30 天' }, quarter: { label: '最近 90 天' },
} as const
export type RegistrationRange = keyof typeof registrationRanges
export type UserQuickFilter = 'all' | 'members' | 'today' | 'inactive'
export interface UserStatsData { total: number; members: number; today: number; inactive: number }
