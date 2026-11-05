export const services = {
  api: { name: 'API 服务', description: '客户端与服务器通信' },
  database: { name: '数据库', description: '账号与记录数据存储' },
  account: { name: '账号服务', description: '注册、登录与身份验证' },
  membership: { name: '会员开通服务', description: '订单支付后发放会员权益' },
  sync: { name: '云端同步服务', description: '专注记录的上传与下载' },
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
  healthy: '正常', unavailable: '异常', unknown: '状态未知',
}

export function unknownChecks(): ServiceCheck[] {
  return (Object.keys(services) as ServiceId[]).map(id => ({
    id, status: 'unknown', latencyMs: null, errorRate: null,
    metricLabel: id === 'database' ? '检查耗时' : '响应', note: '尚未获取有效的健康检查结果。',
  }))
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
export const formatLatency = (latency: number | null) => latency === null ? '—' : `${latency} ms`

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

export function monitorOverview(snapshot: MonitorSnapshot) {
  const active = snapshot.incidents.filter(incident => incident.recoveredAt === null)
  const recent = snapshot.incidents.filter(incident => incident.recoveredAt === null || incident.recoveredAt >= snapshot.checkedAt - 86400000)
  return { active, recent, status: overallStatus(snapshot.checks) }
}
