export const ranges = [7, 30, 90] as const
export type TrendRange = (typeof ranges)[number]

export interface TrendPoint {
  date: string
  day: string
  users: number
  members: number
}

const dailyUsers = [68, 96, 88, 143, 171, 238, 178]
const dailyMembers = [20, 29, 22, 36, 24, 46, 54]
const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const history: TrendPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 10, 4 - (89 - i)))
  const recent = i - (90 - dailyUsers.length)
  const wave = Math.sin(i * .34) * 25 + Math.cos(i * 1.51) * 12

  return {
    date: date.toISOString().slice(5, 10),
    day: weekday[date.getUTCDay()],
    users: dailyUsers[recent] ?? Math.round(57 + i * 1.05 + wave),
    members: dailyMembers[recent] ?? Math.round(13 + i * .29 + wave * .24),
  }
})

export const trends: Record<TrendRange, TrendPoint[]> = {
  7: history.slice(-7),
  30: history.slice(-30),
  90: history,
}

export const summary = {
  totalUsers: 12846,
  usersWeekChange: 128,
  newUsersToday: 128,
  usersDayChange: 36,
}

export const membership = [
  { name: '月会员', value: 1041, color: '#ff7908' },
  { name: '年会员', value: 1124, color: '#ffb481' },
  { name: '永久会员', value: 296, color: '#a58af9' },
]

export const activeMembers = membership.reduce((total, plan) => total + plan.value, 0)

export type OrderStatus = 'paid' | 'pending' | 'canceled'
type Plan = (typeof membership)[number]['name']

interface Order {
  id: string
  email: string
  plan: Plan
  status: OrderStatus
  createdAt: string
}

export const recentOrders: Order[] = [
  { id: 'FT202611040328', email: 'user01@example.com', plan: '年会员', status: 'paid', createdAt: '11-04 17:52' },
  { id: 'FT202611040327', email: 'user02@example.com', plan: '月会员', status: 'paid', createdAt: '11-04 17:36' },
  { id: 'FT202611040326', email: 'user03@example.com', plan: '永久会员', status: 'paid', createdAt: '11-04 16:21' },
  { id: 'FT202611040325', email: 'user04@example.com', plan: '年会员', status: 'pending', createdAt: '11-04 15:47' },
  { id: 'FT202611040324', email: 'user05@example.com', plan: '月会员', status: 'canceled', createdAt: '11-04 14:03' },
]

export const recentUsers = [
  { email: 'newuser1286@example.com', avatar: 'ming', registeredAt: '11-04 17:58' },
  { email: 'newuser1285@example.com', avatar: 'corgi', registeredAt: '11-04 17:44' },
  { email: 'newuser1284@example.com', avatar: 'mountains', registeredAt: '11-04 16:39' },
  { email: 'newuser1283@example.com', avatar: 'lin', registeredAt: '11-04 16:21' },
  { email: 'newuser1282@example.com', avatar: 'panda', registeredAt: '11-04 15:56' },
]

export const formatNumber = new Intl.NumberFormat('zh-CN').format
export const formatShare = new Intl.NumberFormat('zh-CN', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format
