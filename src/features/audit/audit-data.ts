export const auditCategories = { users: '用户管理', orders: '订单管理', plans: '套餐管理', settings: '系统设置' } as const
export type AuditCategory = keyof typeof auditCategories
export type AuditStatus = 'success' | 'failure'
export interface AuditChange { field: string; before: string | null; after: string | null }
type AuditResult = { status: 'success'; changes: readonly AuditChange[] } | { status: 'failure'; reason: string }
export interface AuditLog {
  id: string; occurredAt: string; administrator: string; source: string; ip: string | null
  category: AuditCategory; action: string; target: string; targetId: string; result: AuditResult; note?: string | null
}
export type AuditPeriod = 'week' | 'month' | 'custom'
export interface AuditDateRange { start: string; end: string }
export function presetAuditRange(period: Exclude<AuditPeriod, 'custom'>, now = new Date()): AuditDateRange {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const start = new Date(today + 'T00:00:00Z')
  start.setUTCDate(start.getUTCDate() - (period === 'week' ? 6 : 29))
  return { start: start.toISOString().slice(0, 10), end: today }
}
export interface AuditFilters { query: string; category: AuditCategory | 'all'; status: AuditStatus | 'all' }
export const defaultAuditFilters: AuditFilters = { query: '', category: 'all', status: 'all' }
