import type { UserFilterValues } from './user-list-model'
import type { AccountStatus, Membership, User, UserStatsData } from './user-types'

export interface AdminUserResponse {
  id: string; email: string; status: AccountStatus; registeredAtUtc: string; lastLoginAtUtc: string | null
  membershipPlan: 'monthly' | 'annual' | 'lifetime' | null
  membershipStartsAtUtc: string | null; membershipExpiresAtUtc: string | null; lockedUntilUtc: string | null
}
export interface UsersPage {
  items: AdminUserResponse[]; total: number; page: number; pageSize: number
  stats: UserStatsData; serverTimeUtc: string; accountStatusNote: string
}
const dateTime = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
export function toUser(data: AdminUserResponse): User {
  const plan = data.membershipPlan
  const membership: Membership | null = plan === 'lifetime' ? { plan } : plan && data.membershipExpiresAtUtc
    ? { plan, expiresOn: dateTime.format(new Date(data.membershipExpiresAtUtc)) } : null
  return { id: data.id, email: data.email, status: data.status, membership,
    registeredAt: dateTime.format(new Date(data.registeredAtUtc)),
    lastLoginAt: data.lastLoginAtUtc ? dateTime.format(new Date(data.lastLoginAtUtc)) : null,
    lockedUntil: data.lockedUntilUtc ? dateTime.format(new Date(data.lockedUntilUtc)) : null }
}
export function usersPath(filters: UserFilterValues, page: number, pageSize: number) {
  const query = new URLSearchParams({ ...filters, page: String(page), pageSize: String(pageSize) })
  return `/api/v1/admin/users?${query}`
}
