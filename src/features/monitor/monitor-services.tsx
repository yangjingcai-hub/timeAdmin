import { CircleCheck, CircleHelp, CircleX, Database, Layers, Server, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLatency, overallStatus, services, serviceStatusLabels, type ServiceCheck, type ServiceStatus } from './monitor-data'

const statusIcons = { healthy: CircleCheck, unavailable: CircleX, unknown: CircleHelp }
const coreServices = [
  { id: 'api', icon: Server, timing: '本次监控请求往返耗时' },
  { id: 'database', icon: Database, timing: '数据库就绪检查耗时' },
] as const

export function MonitorStatus({ checks, loading, failed }: { checks: ServiceCheck[]; loading: boolean; failed: boolean }) {
  const status = overallStatus(checks)
  const affected = checks.filter(check => check.status === 'unavailable').map(check => services[check.id].name).join('、')
  const Icon = status === 'healthy' ? CircleCheck : status === 'unavailable' ? TriangleAlert : CircleHelp
  const title = loading ? '正在检查核心服务状态' : failed ? '监控状态检测失败'
    : status === 'healthy' ? '系统运行正常'
    : status === 'unavailable' ? `${affected}异常` : '核心服务状态待确认'
  const description = loading ? '正在获取最新的健康检查结果。' : failed ? '暂时无法获取监控数据，请稍后重试。'
    : status === 'healthy' ? '所有核心服务均正常运行。'
    : status === 'unavailable' ? '请查看服务状态及告警记录。'
    : '本次检查结果不完整，请刷新状态重试。'

  return <section className="monitor-status" data-tone={status} aria-live="polite">
    <span className="monitor-status-icon"><Icon size={35} strokeWidth={1.9} aria-hidden="true" /></span>
    <div className="monitor-status-copy"><h2>{title}</h2><p>{description}</p></div>
  </section>
}

function ServiceStatusBadge({ status, label = serviceStatusLabels[status], showIcon = false }: { status: ServiceStatus; label?: string; showIcon?: boolean }) {
  const Icon = statusIcons[status]
  return <Badge className="monitor-badge" data-tone={status}>{showIcon && <Icon size={15} aria-hidden="true" />}{label}</Badge>
}

export function MonitorServices({ checks, loading }: { checks: ServiceCheck[]; loading: boolean }) {
  const overall = overallStatus(checks)
  return <Card className="monitor-panel monitor-services" aria-labelledby="monitor-services-title">
    <CardHeader className="monitor-panel-header">
      <CardTitle id="monitor-services-title" className="monitor-panel-title"><span className="monitor-panel-icon"><Layers size={23} aria-hidden="true" /></span>核心服务状态</CardTitle>
      <ServiceStatusBadge status={overall} label={loading ? '检测中' : overall === 'healthy' ? '全部正常' : overall === 'unavailable' ? '存在异常' : '待确认'} showIcon />
    </CardHeader>
    <div className="monitor-service-list" role="list" aria-label="核心服务状态" aria-busy={loading}>
      {coreServices.map(({ id, icon: Icon, timing }) => {
        const check = checks.find(item => item.id === id)
        const status = check?.status ?? 'unknown'
        return <div key={id} className="monitor-service-row" role="listitem">
          <span className="monitor-service-name">
            <Icon className="monitor-service-icon" size={24} aria-hidden="true" />
            <strong>{services[id].name}</strong>
          </span>
          <div className="monitor-service-metrics" title={`${timing}。${check?.note ?? '尚未获取有效的健康检查结果。'}`}>
            {formatLatency(check?.latencyMs ?? null)}
          </div>
          <ServiceStatusBadge status={status} label={loading ? '检测中' : undefined} />
        </div>
      })}
    </div>
  </Card>
}
