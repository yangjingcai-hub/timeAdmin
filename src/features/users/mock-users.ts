export type AccountStatus = 'active' | 'disabled'

export type Membership =
  | { plan: 'monthly' | 'yearly'; expiresOn: string }
  | { plan: 'lifetime' }

export interface User {
  id: string
  email: string
  membership: Membership | null
  registeredAt: string
  lastLoginAt: string | null
  status: AccountStatus
}

// Use a fixed clock so the mock dashboard and its relative date filters agree.
const snapshot = Date.UTC(2026, 10, 4)

function daysBeforeSnapshot(days: number) {
  return new Date(snapshot - days * 86_400_000).toISOString().slice(0, 10)
}

export const snapshotDate = daysBeforeSnapshot(0)

export const registrationRanges = {
  all: { label: '全部时间', start: null },
  today: { label: '今日', start: snapshotDate },
  week: { label: '最近 7 天', start: daysBeforeSnapshot(6) },
  month: { label: '最近 30 天', start: daysBeforeSnapshot(29) },
  quarter: { label: '最近 90 天', start: daysBeforeSnapshot(89) },
} as const

export type RegistrationRange = keyof typeof registrationRanges

const referenceRows: Pick<User, 'membership' | 'registeredAt' | 'lastLoginAt' | 'status'>[] = [
  { membership: { plan: 'yearly', expiresOn: '2027-11-04' }, registeredAt: '2026-01-10 14:22', lastLoginAt: '2026-11-04 17:58', status: 'active' },
  { membership: { plan: 'monthly', expiresOn: '2026-12-04' }, registeredAt: '2026-01-09 09:36', lastLoginAt: '2026-11-04 17:44', status: 'active' },
  { membership: { plan: 'lifetime' }, registeredAt: '2025-12-28 21:17', lastLoginAt: '2026-11-04 16:39', status: 'active' },
  { membership: null, registeredAt: '2026-02-18 11:05', lastLoginAt: '2026-11-04 16:21', status: 'active' },
  { membership: null, registeredAt: '2026-02-16 19:40', lastLoginAt: '2026-11-04 15:56', status: 'active' },
  { membership: { plan: 'yearly', expiresOn: '2027-08-12' }, registeredAt: '2025-11-03 08:27', lastLoginAt: '2026-11-04 15:21', status: 'active' },
  { membership: null, registeredAt: '2026-01-28 10:14', lastLoginAt: '2026-11-03 22:11', status: 'active' },
  { membership: { plan: 'monthly', expiresOn: '2026-12-02' }, registeredAt: '2026-01-27 16:09', lastLoginAt: '2026-11-03 20:47', status: 'active' },
  { membership: null, registeredAt: '2026-01-25 14:33', lastLoginAt: null, status: 'disabled' },
  { membership: { plan: 'yearly', expiresOn: '2027-05-16' }, registeredAt: '2025-10-19 13:20', lastLoginAt: '2026-11-03 10:08', status: 'active' },
]

const mockPlans: Membership[] = [
  { plan: 'monthly', expiresOn: '2026-12-04' },
  { plan: 'yearly', expiresOn: '2027-11-04' },
  { plan: 'lifetime' },
]

const totalUsers = 12_846
const generatedCount = totalUsers - referenceRows.length
const generatedMemberCount = 2_461 - referenceRows.filter((row) => row.membership).length

export const mockUsers: User[] = Array.from({ length: totalUsers }, (_, index) => {
  const identity = {
    id: String(1_003_826 - index),
    email: `user${String(index + 1).padStart(2, '0')}@example.com`,
  }

  const reference = referenceRows[index]
  if (reference) return { ...identity, ...reference }

  const offset = index - referenceRows.length
  const daysAgo = offset < 128 ? 0 : 1 + (offset % 560)
  const memberIndex = Math.floor((offset + 1) * generatedMemberCount / generatedCount)
  const isMember = memberIndex > Math.floor(offset * generatedMemberCount / generatedCount)
  const membership = isMember ? mockPlans[(memberIndex - 1) % mockPlans.length] : null

  return {
    ...identity,
    membership,
    registeredAt: `${daysBeforeSnapshot(daysAgo)} 09:${String(offset % 60).padStart(2, '0')}`,
    lastLoginAt: offset % 11 === 0 ? null : `${daysBeforeSnapshot(Math.min(daysAgo, offset % 6))} 17:30`,
    status: offset >= 500 && offset < 511 ? 'disabled' : 'active',
  }
})
