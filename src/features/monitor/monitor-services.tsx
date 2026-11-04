import { Check, ChevronRight, Cloud, CreditCard, Database, Server, TriangleAlert, UserRound, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { errorRateLabel, formatLatency, services, serviceStatusLabels, type ServiceCheck, type ServiceStatus } from './monitor-data'

const statusContent = {
  healthy: { title: '所有核心服务运行正常', description: '当前各项服务状态良好，用户可以正常使用。', icon: Check },
  degraded: { title: '部分核心服务异常', description: '部分功能可能响应缓慢，请查看服务状态及待处理告警。', icon: TriangleAlert },
  unavailable: { title: '核心服务严重故障', description: '部分核心服务不可用，用户的云端功能可能受到影响。', icon: X },
}

const serviceIcons = { api: Server, database: Database, account: UserRound, membership: CreditCard, sync: Cloud }

export function MonitorStatus({ status }: { status: ServiceStatus }) {
  const { title, description, icon: Icon } = statusContent[status]

  return (
    <section className="monitor-status" data-tone={status} aria-live="polite">
      <svg className="monitor-waves" viewBox="0 0 280 96" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 96C90 96 95 27 196 19C223 16 255 18 280 24V96Z" fill="currentColor" opacity=".10" />
        <path d="M85 96C157 96 164 55 226 52C251 50 267 51 280 55V96Z" fill="currentColor" opacity=".14" />
      </svg>
      <span className="monitor-status-icon"><Icon size={34} strokeWidth={2.8} aria-hidden="true" /></span>
      <div><h2>{title}</h2><p>{description}</p></div>
    </section>
  )
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  return <Badge className="monitor-badge" data-tone={status}>{serviceStatusLabels[status]}</Badge>
}

export function MonitorServices({ checks, onDetails }: { checks: ServiceCheck[]; onDetails: (check: ServiceCheck, trigger: HTMLButtonElement) => void }) {
  return (
    <Card className="monitor-panel monitor-services" aria-labelledby="monitor-services-title">
      <CardHeader><CardTitle id="monitor-services-title">核心服务状态</CardTitle></CardHeader>
      <div className="monitor-service-grid">
        {checks.map((check) => {
          const { name, description } = services[check.id]
          const Icon = serviceIcons[check.id]
          return (
            <Button key={check.id} type="button" variant="ghost" className="monitor-service" aria-label={`${name} · ${serviceStatusLabels[check.status]} · 查看详情`}
              onClick={(event) => onDetails(check, event.currentTarget)}>
              <span className="monitor-service-top">
                <span className="monitor-service-icon" data-tone={check.status}><Icon size={26} aria-hidden="true" /></span>
                <span className="monitor-service-copy">
                  <span className="monitor-service-title"><strong>{name}</strong><ServiceStatusBadge status={check.status} /></span>
                  <span className="monitor-service-description">{description}</span>
                </span>
                <ChevronRight className="monitor-service-chevron" size={18} aria-hidden="true" />
              </span>
              <span className="monitor-service-metrics">
                <span>{check.id === 'database' ? '连接延迟' : '响应'}：<strong>{formatLatency(check.latencyMs)}</strong></span>
                <span>错误率：<strong>{errorRateLabel(check.errorRate)}</strong></span>
              </span>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
