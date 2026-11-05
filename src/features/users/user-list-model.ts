import type { AccountStatus, RegistrationRange, UserQuickFilter } from './user-types'
export interface UserFilterValues {
  query: string
  membership: 'all' | 'member' | 'nonMember'
  account: 'all' | AccountStatus
  registration: RegistrationRange
  quick: UserQuickFilter
}
export const defaultUserFilters: UserFilterValues = { query: '', membership: 'all', account: 'all', registration: 'all', quick: 'all' }
export const quickFilterLabels = { members: '有效会员', today: '今日新增', inactive: '已停用账号' } as const
