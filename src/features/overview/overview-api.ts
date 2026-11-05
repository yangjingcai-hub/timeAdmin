export const ranges = [7, 30, 90] as const
export type TrendRange = typeof ranges[number]
export interface TrendPoint { date: string; users: number; members: number }
export interface OverviewSummary {
  totalUsers: number
  activeMembers: number
  newUsersToday: number
  newUsersLastSevenDays: number
  memberShare: number
  usersDayChange: number
}
export interface MembershipCount { kind: string; count: number; share: number }
export interface RecentOrder { id: string; email: string; plan: string; status: string; createdAtUtc: string }
export interface RecentUser { id: string; email: string; registeredAtUtc: string; avatarUrl?: string | null }
export interface OverviewData {
  summary: OverviewSummary
  trend: TrendPoint[]
  membership: MembershipCount[]
  recentOrders: RecentOrder[]
  recentUsers: RecentUser[]
}

export const overviewPath = (days: TrendRange) => `/api/v1/admin/overview?days=${days}`

export const formatNumber = new Intl.NumberFormat('zh-CN').format
export const formatShare = new Intl.NumberFormat('zh-CN', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format
export const planNames: Record<string, string> = { monthly: '月会员', annual: '年会员', lifetime: '永久会员' }
const dateTime = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
export const formatActivityTime = (value: string) => dateTime.format(new Date(value))
