export const services = {
  api: { name: 'API 服务', description: '客户端与服务器通信' },
  database: { name: '数据库', description: '账号与记录数据存储' },
  account: { name: '账号服务', description: '注册、登录与身份验证' },
  membership: { name: '会员开通服务', description: '订单支付后发放会员权益' },
  sync: { name: '云端同步服务', description: '专注记录的上传与下载' },
} as const

export type ServiceId = keyof typeof services
export type ServiceStatus = 'healthy' | 'degraded' | 'unavailable'

export interface ServiceCheck {
  id: ServiceId
  status: ServiceStatus
  latencyMs: number | null
  errorRate: number
  note: string
}

interface IncidentInfo {
  service: ServiceId
  type: string
  severity: 'warning' | 'danger'
  error: string
  impact: string
}

export interface Incident extends IncidentInfo {
  id: string
  occurredAt: number
  recoveredAt: number | null
}

interface MonitorSnapshot {
  checkedAt: number
  lastOutageEndedAt: number
  checks: ServiceCheck[]
  incidents: Incident[]
}

const minute = 60_000
const hour = 60 * minute
const day = 24 * hour
export const serviceStatusLabels: Record<ServiceStatus, string> = { healthy: '正常', degraded: '异常', unavailable: '不可用' }

const healthyChecks: ServiceCheck[] = [
  { id: 'api', status: 'healthy', latencyMs: 86, errorRate: .0002, note: '客户端请求响应正常。' },
  { id: 'database', status: 'healthy', latencyMs: 6, errorRate: 0, note: '数据库连接与读写检查均通过。' },
  { id: 'account', status: 'healthy', latencyMs: 78, errorRate: .0001, note: '注册、登录与身份验证检查均通过。' },
  { id: 'membership', status: 'healthy', latencyMs: 92, errorRate: .0003, note: '会员权益发放队列运行正常。' },
  { id: 'sync', status: 'healthy', latencyMs: 110, errorRate: .0004, note: '专注记录上传和下载检查均通过。' },
]

const history: (IncidentInfo & { minutesAgo: number; resolvedIn: number })[] = [
  { service: 'membership', type: '请求超时', severity: 'warning', error: '支付回调处理超时', impact: '1 个订单', minutesAgo: 124, resolvedIn: 6 },
  { service: 'sync', type: '处理失败', severity: 'danger', error: '记录同步写入失败', impact: '3 条同步请求', minutesAgo: 219, resolvedIn: 4 },
  { service: 'account', type: '请求异常', severity: 'warning', error: '第三方验证码服务响应异常', impact: '部分用户', minutesAgo: 1196, resolvedIn: 10 },
]

const syncIncident: IncidentInfo = {
  service: 'sync', type: '响应超时', severity: 'warning', error: '专注记录上传请求出现间歇性超时。', impact: '部分专注记录上传延迟',
}

const apiIncident: IncidentInfo = {
  service: 'api', type: '服务不可用', severity: 'danger', error: 'API 健康检查失败，网关未收到有效响应。', impact: '客户端云端请求暂时不可用',
}

function newIncident(info: IncidentInfo, occurredAt: number): Incident {
  return { ...info, id: `${info.service}-${occurredAt}`, occurredAt, recoveredAt: null }
}

export function initialMonitor(now: number): MonitorSnapshot {
  return {
    checkedAt: now,
    lastOutageEndedAt: now - 7 * day - 12 * hour,
    checks: healthyChecks,
    incidents: history.map(({ minutesAgo, resolvedIn, ...info }) => {
      const occurredAt = now - minutesAgo * minute
      return { ...newIncident(info, occurredAt), recoveredAt: occurredAt + resolvedIn * minute }
    }),
  }
}

export function overallStatus(checks: ServiceCheck[]): ServiceStatus {
  if (checks.some(({ status }) => status === 'unavailable')) return 'unavailable'
  return checks.some(({ status }) => status === 'degraded') ? 'degraded' : 'healthy'
}

export function refreshMonitor(current: MonitorSnapshot, checkedAt: number): MonitorSnapshot {
  const incidents = current.incidents.filter((incident) => incident.recoveredAt === null || incident.occurredAt >= checkedAt - day)

  // Cycle through local fixture states on each manual refresh.
  switch (overallStatus(current.checks)) {
    case 'healthy':
      return {
        ...current, checkedAt,
        checks: healthyChecks.map((check) => check.id === 'sync'
          ? { ...check, status: 'degraded', latencyMs: 710, errorRate: .084, note: syncIncident.error }
          : check),
        incidents: [newIncident(syncIncident, checkedAt), ...incidents],
      }
    case 'degraded':
      return {
        ...current, checkedAt,
        checks: current.checks.map((check) => check.id === 'api'
          ? { ...check, status: 'unavailable', latencyMs: null, errorRate: 1, note: apiIncident.error }
          : check),
        incidents: [newIncident(apiIncident, checkedAt), ...incidents],
      }
    case 'unavailable':
      return {
        checkedAt, lastOutageEndedAt: checkedAt, checks: healthyChecks,
        incidents: incidents.map((incident) => incident.recoveredAt === null ? { ...incident, recoveredAt: checkedAt } : incident),
      }
  }
}

const formatPercent = new Intl.NumberFormat('zh-CN', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export function formatCheckTime(timestamp: number) {
  return dateFormatter.format(timestamp).replaceAll('/', '-')
}

export function errorRateLabel(rate: number) {
  return formatPercent(rate)
}

export function formatLatency(latencyMs: number | null) {
  return latencyMs === null ? '—' : `${latencyMs} ms`
}

function uptimeLabel(elapsed: number) {
  const days = Math.floor(elapsed / day)
  const hours = Math.floor((elapsed % day) / hour)
  const minutes = Math.floor((elapsed % hour) / minute)
  if (days > 0) return `${days} 天 ${hours} 小时`
  return hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
}

// Mock request volumes weight response times. Database connection latency is a separate metric.
const requestWeights: Record<ServiceId, number> = { api: 450, database: 0, account: 350, membership: 100, sync: 90 }

export function monitorOverview(snapshot: MonitorSnapshot) {
  const active = snapshot.incidents.filter(({ recoveredAt }) => recoveredAt === null)
  const recent = snapshot.incidents.filter(({ occurredAt }) => occurredAt >= snapshot.checkedAt - day)
  const status = overallStatus(snapshot.checks)
  const samples = snapshot.checks.filter(({ latencyMs }) => latencyMs !== null)
  const weight = samples.reduce((total, { id }) => total + requestWeights[id], 0)
  const weightedLatency = samples.reduce((total, { latencyMs, id }) => total + (latencyMs ?? 0) * requestWeights[id], 0)
  return {
    status, active, recent,
    healthyRate: formatPercent(snapshot.checks.filter(({ status }) => status === 'healthy').length / snapshot.checks.length),
    averageLatency: formatLatency(weight ? Math.round(weightedLatency / weight) : null),
    uptime: status === 'unavailable' ? '故障处理中' : uptimeLabel(snapshot.checkedAt - snapshot.lastOutageEndedAt),
  }
}
