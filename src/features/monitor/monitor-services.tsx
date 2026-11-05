import { Check, CircleCheck, CircleHelp, CircleX, Database, Server, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLatency, overallStatus, services, serviceStatusLabels, type ServiceCheck, type ServiceStatus } from './monitor-data'

const statusIcons = { healthy: CircleCheck, unavailable: CircleX, unknown: CircleHelp }
const coreServices = [
  { id: 'api', icon: Server, description: '服务器运行与接口响应', metric: '本次响应', timing: '本次监控请求往返耗时' },
  { id: 'database', icon: Database, description: '数据库连接与就绪检查', metric: '检查耗时', timing: '数据库就绪检查耗时' },
] as const

export function MonitorStatus({ checks, loading, failed }: { checks: ServiceCheck[]; loading: boolean; failed: boolean }) {
  const status = overallStatus(checks)
  const affected = checks.filter(check => check.status === 'unavailable').length
  const unknown = checks.filter(check => check.status === 'unknown').length
  const Icon = status === 'healthy' ? Check : status === 'unavailable' ? TriangleAlert : CircleHelp
  const title = loading ? '正在检查核心服务状态' : failed ? '监控状态检测失败'
    : status === 'healthy' ? '所有核心服务运行正常'
    : status === 'unavailable' ? '部分核心服务出现异常' : '部分核心服务状态未知'
  const description = loading ? '正在获取最新的健康检查结果。' : failed ? '暂时无法获取监控数据，请稍后重试。'
    : status === 'healthy' ? '当前各项服务状态良好，用户可以正常使用。'
    : status === 'unavailable' ? `检测到 ${affected} 项服务异常，请查看服务状态和当前告警。`
    : `${unknown} 项服务尚未提供有效的独立健康检查结果。`

  return <section className="monitor-status" data-tone={status} aria-live="polite">
    {status !== 'unknown' && <svg className="monitor-waves" viewBox="0 0 280 96" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 96C90 96 95 27 196 19C223 16 255 18 280 24V96Z" fill="currentColor" opacity=".10" />
      <path d="M85 96C157 96 164 55 226 52C251 50 267 51 280 55V96Z" fill="currentColor" opacity=".14" />
    </svg>}
    <span className="monitor-status-icon"><Icon size={31} strokeWidth={2.5} aria-hidden="true" /></span>
    <div><h2>{title}</h2><p>{description}</p></div>
  </section>
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const Icon = statusIcons[status]
  return <Badge className="monitor-badge" data-tone={status}><Icon size={14} aria-hidden="true" />{serviceStatusLabels[status]}</Badge>
}

export function MonitorServices({ checks, loading }: { checks: ServiceCheck[]; loading: boolean }) {
  return <Card className="monitor-panel monitor-services" aria-labelledby="monitor-services-title">
    <CardHeader><div>
      <CardTitle id="monitor-services-title">核心服务状态</CardTitle>
      <p className="monitor-services-caption">监控管理后台的关键基础服务，保障系统稳定运行。</p>
    </div></CardHeader>
    <div className="monitor-service-list" role="list" aria-label="核心服务状态" aria-busy={loading}>
      {coreServices.map(({ id, icon: Icon, description, metric, timing }) => {
        const check = checks.find(item => item.id === id)
        const status = check?.status ?? 'unknown'
        return <div key={id} className="monitor-service-row" role="listitem">
          <span className="monitor-service-name">
            <span className="monitor-service-icon" data-tone={status}><Icon size={23} aria-hidden="true" /></span>
            <span><strong>{services[id].name}</strong><span className="monitor-service-description">{description}</span></span>
          </span>
          <div className="monitor-service-metrics" title={`${timing}。${check?.note ?? '尚未获取有效的健康检查结果。'}`}>
            <span>{metric}：<strong>{formatLatency(check?.latencyMs ?? null)}</strong></span>
          </div>
          <ServiceStatusBadge status={status} />
        </div>
      })}
    </div>
  </Card>
}
