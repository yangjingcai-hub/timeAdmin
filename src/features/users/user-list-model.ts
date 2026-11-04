import { useEffect, useMemo, useState } from 'react'
import { mockUsers, registrationRanges, snapshotDate, type AccountStatus, type RegistrationRange, type User } from './mock-users'

export interface UserFilterValues {
  query: string
  membership: 'all' | 'member' | 'nonMember'
  account: 'all' | AccountStatus
  registration: RegistrationRange
}

export const defaultUserFilters: UserFilterValues = { query: '', membership: 'all', account: 'all', registration: 'all' }

const storageKey = 'focustime-admin:mock-account-status:v1'
type StatusOverrides = Record<string, AccountStatus>

function readOverrides(): StatusOverrides {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([, status]) => status === 'active' || status === 'disabled'))
  } catch {
    return {}
  }
}

export function useMockAccounts() {
  const [overrides, setOverrides] = useState(readOverrides)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(overrides))
    } catch {
      // The page can still simulate account changes when browser storage is unavailable.
    }
  }, [overrides])

  const users = useMemo(() => mockUsers.map((user) => overrides[user.id] ? { ...user, status: overrides[user.id] } : user), [overrides])

  function updateAccount(user: User, status: AccountStatus) {
    setOverrides((previous) => ({ ...previous, [user.id]: status }))
  }

  return { users, updateAccount }
}

export function getUserStats(users: User[]) {
  return users.reduce((counts, user) => {
    if (user.membership) counts.members += 1
    if (user.registeredAt.startsWith(snapshotDate)) counts.today += 1
    if (user.status === 'disabled') counts.disabled += 1
    return counts
  }, { total: users.length, members: 0, today: 0, disabled: 0 })
}

export function filterUsers(users: User[], filters: UserFilterValues) {
  const query = filters.query.trim().toLowerCase()
  const start = registrationRanges[filters.registration].start

  return users.filter((user) => {
    if (query && !user.id.includes(query) && !user.email.toLowerCase().includes(query)) return false
    if (filters.membership !== 'all' && Boolean(user.membership) !== (filters.membership === 'member')) return false
    if (filters.account !== 'all' && user.status !== filters.account) return false
    return !start || user.registeredAt >= start
  })
}
