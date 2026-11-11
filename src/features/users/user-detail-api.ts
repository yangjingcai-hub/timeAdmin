import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import { toOrder, type AdminOrderResponse } from '@/features/orders/order-api'
import { plans, type PaymentStatus } from '@/features/orders/order-types'

export type DetailTone = 'neutral' | 'blue' | 'green' | 'orange' | 'red'
export interface UserAccountData {
  userId: string
  security: { device: string | null; operatingSystem: string | null; clientVersion: string | null; ip: string | null
    region: string | null; passwordSet: boolean; passwordResetAtUtc: string | null; risk: string | null }
  stats: { focusSeconds: number; completedTasks: number; focusDays: number; goals: number | null; records: number
    rules: number; remainingTasks: number | null; totalTasks: number | null; lastSyncAtUtc: string | null }
}
export interface UserCurrentMembership {
  grantId: string; plan: string; startsAtUtc: string; expiresAtUtc: string | null
  source: string | null; orderId: string | null; orderNumber: string | null
}
export interface UserMembershipData { userId: string; current: UserCurrentMembership | null }
export interface UserDevice {
  id: string; deviceId: string; name: string; operatingSystem: string; clientVersion: string
  firstLoginAtUtc: string; lastActiveAtUtc: string; expiresAtUtc: string
  status: 'valid' | 'refresh-required' | 'expired' | 'revoked'; ip: string | null; location: string | null
}
export interface UserSessionsData { userId: string; items: UserDevice[] }
export interface UserLog { id: string; time: string; admin: string; type: string; content: string; result: string; note: string | null }
export interface UserAuditData { userId: string; items: UserLog[]; total: number; page: number; pageSize: number }
export interface UserDetailOrder {
  id: string; orderId: string; plan: string; amount: number; payment: PaymentStatus; createdAt: string
}
export function toUserDetailOrder(response: AdminOrderResponse): UserDetailOrder {
  const order = toOrder(response)
  return { id: order.id, orderId: order.orderId, plan: plans[order.plan]?.label ?? order.plan,
    amount: order.amountCents / 100, payment: order.payment.status, createdAt: order.createdAt.slice(0, 16) }
}

const dateTime = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
export function formatDetailTime(value: string | null | undefined, seconds = false) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  const formatted = dateTime.format(parsed)
  return seconds ? formatted : formatted.slice(0, 16)
}
export function detailPath(userId: string, section: string) {
  return `/api/v1/admin/users/${encodeURIComponent(userId)}/${section}`
}

export interface UserDetailRequest<T> { data: T | undefined; loading: boolean; error: string; retry: () => void }

// Cache keys include both the path and retry attempt. Old-user and old-page responses never render.
export function useUserDetailRequest<T>(path: string | null, userId: string | null, identity: 'id' | 'userId' | 'orders' = 'userId'): UserDetailRequest<T> {
  const { request } = useAdminAuth()
  const [attempt, setAttempt] = useState(0)
  const key = `${userId}:${path}:${attempt}`
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null)
  useEffect(() => {
    if (!path || !userId) return
    const controller = new AbortController()
    request<T>(path, { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return
      const payload = data as { id?: string; userId?: string; items?: { userId?: string }[] }
      const matches = (id: string | undefined) => id?.toLowerCase() === userId.toLowerCase()
      if (identity === 'orders' ? !Array.isArray(payload.items) || !payload.items.every(item => matches(item.userId)) : !matches(payload[identity]))
        throw new Error('Unexpected user identity in response')
      setResult({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ key, error: error instanceof ApiError && error.status === 404
        ? '未找到该用户或该记录。' : '数据加载失败，请重试。' })
    })
    return () => controller.abort()
  }, [path, userId, identity, request, key])
  const current = result?.key === key ? result : null
  return { data: current?.data, loading: !!path && !current, error: current?.error ?? '', retry: () => setAttempt(value => value + 1) }
}
