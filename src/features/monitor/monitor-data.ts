export const services = {
  api: { name: 'API 服务' },
  database: { name: '数据库' },
} as const

export type ServiceId = keyof typeof services
export type ServiceStatus = 'healthy' | 'unavailable' | 'unknown'
export interface ServiceCheck {
  id: ServiceId
  status: ServiceStatus
  latencyMs: number | null
  errorRate: number | null
  metricLabel: string
  note: string
}
export interface Incident {
  id: string
  service: ServiceId
  type: string
  severity: 'warning' | 'danger'
  error: string
  impact: string | null
  occurredAt: number
  recoveredAt: number | null
}
export interface MonitorSnapshot {
  checkedAt: number
  historyStartedAt: number
  checks: ServiceCheck[]
  incidents: Incident[]
}

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  healthy: '正常', unavailable: '异常', unknown: '未确认',
}

export function coreChecks(checks: ServiceCheck[] = []): ServiceCheck[] {
  return (Object.keys(services) as ServiceId[]).map(id => {
    const matches = checks.filter(check => check.id === id)
    if (matches.length === 1 && Object.hasOwn(serviceStatusLabels, matches[0].status)) return matches[0]
    return {
      id, status: 'unknown', latencyMs: null, errorRate: null,
      metricLabel: id === 'database' ? '检查耗时' : '本次响应', note: '尚未获取有效的健康检查结果。',
    }
  })
}

export function overallStatus(checks: ServiceCheck[]) {
  if (checks.some(check => check.status === 'unavailable')) return 'unavailable'
  return checks.length === Object.keys(services).length && checks.every(check => check.status === 'healthy') ? 'healthy' : 'unknown'
}

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})
export const formatCheckTime = (timestamp: number) => dateFormatter.format(timestamp)
export const formatLatency = (latency: number | null) => latency !== null && Number.isFinite(latency) && latency >= 0 ? `${latency} ms` : '—'

export function formatDuration(elapsed: number) {
  const seconds = Math.max(0, Math.floor(elapsed / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor(seconds % 86400 / 3600)
  const minutes = Math.floor(seconds % 3600 / 60)
  const remainder = seconds % 60
  if (days) return `${days} 天 ${hours} 小时`
  if (hours) return `${hours} 小时 ${minutes} 分钟`
  return `${minutes} 分钟 ${remainder} 秒`
}

export function recentIncidents(snapshot: MonitorSnapshot) {
  return snapshot.incidents.filter(incident => Object.hasOwn(services, incident.service) &&
    (incident.recoveredAt === null || incident.recoveredAt >= snapshot.checkedAt - 86400000))
}
