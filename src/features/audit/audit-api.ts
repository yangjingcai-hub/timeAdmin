import type { AuditDateRange, AuditFilters, AuditLog } from './audit-data'
export interface AdminAuditResponse extends Omit<AuditLog, 'occurredAt' | 'result'> {
  occurredAtUtc: string
  result: { status: 'success' | 'failure'; changes: { field: string; before: string | null; after: string | null }[]; reason: string | null }
}
export interface AuditPage { items: AdminAuditResponse[]; total: number; page: number; pageSize: number; serverTimeUtc: string }
const formatTime = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format
export function toAuditLog(value: AdminAuditResponse): AuditLog {
  return { ...value, occurredAt: formatTime(new Date(value.occurredAtUtc)), result: value.result.status === 'success'
    ? { status: 'success', changes: value.result.changes } : { status: 'failure', reason: value.result.reason || '操作执行失败。' } }
}
export function auditPath(filters: AuditFilters, dates: AuditDateRange, page: number, pageSize: number) {
  const query = new URLSearchParams({ ...filters, start: dates.start, end: dates.end, page: String(page), pageSize: String(pageSize) })
  return '/api/v1/admin/audit-logs?' + query
}
