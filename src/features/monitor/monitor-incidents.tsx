import { Bell, Check, ChevronRight, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCheckTime, services, type Incident } from './monitor-data'

interface IncidentsProps {
  incidents: Incident[]
  onDetails: (incident: Incident, trigger: HTMLButtonElement) => void
}

export function IncidentStatusBadge({ incident }: { incident: Incident }) {
  const recovered = incident.recoveredAt !== null
  return <Badge className="monitor-badge" data-tone={recovered ? 'healthy' : incident.severity === 'danger' ? 'unavailable' : 'degraded'}>{recovered ? '已恢复' : '待处理'}</Badge>
}

export function MonitorIncidents({ incidents, onDetails }: IncidentsProps) {
  return (
    <Card className="monitor-panel monitor-incidents" aria-labelledby="monitor-incidents-title">
      <CardHeader>
        <CardTitle id="monitor-incidents-title" className="monitor-panel-title"><TriangleAlert size={23} aria-hidden="true" />最近异常记录 <span>（近 24 小时）</span></CardTitle>
      </CardHeader>
      <Table className="monitor-table" aria-label="最近异常记录">
        <TableHeader>
          <TableRow>{['发生时间', '影响服务', '异常类型', '错误信息', '影响范围', '状态', '操作'].map((title) => <TableHead key={title}>{title}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell><time dateTime={new Date(incident.occurredAt).toISOString()}>{formatCheckTime(incident.occurredAt)}</time></TableCell>
              <TableCell>{services[incident.service].name}</TableCell>
              <TableCell><Badge className="monitor-badge" data-tone={incident.severity === 'danger' ? 'unavailable' : 'degraded'}>{incident.type}</Badge></TableCell>
              <TableCell className="monitor-incident-message">{incident.error}</TableCell>
              <TableCell className="monitor-incident-message">{incident.impact}</TableCell>
              <TableCell><IncidentStatusBadge incident={incident} /></TableCell>
              <TableCell><Button type="button" variant="ghost" size="sm" className="monitor-incident-link"
                aria-label={`查看详情 · ${services[incident.service].name} · ${incident.type}`}
                onClick={(event) => onDetails(incident, event.currentTarget)}>查看详情</Button></TableCell>
            </TableRow>
          ))}
          {incidents.length === 0 && <TableRow><TableCell colSpan={7} className="monitor-no-incidents">近 24 小时内暂无异常记录</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  )
}

export function MonitorAlerts({ incidents, onDetails }: IncidentsProps) {
  return (
    <Card className="monitor-panel monitor-alerts" aria-labelledby="monitor-alerts-title">
      <CardHeader><CardTitle id="monitor-alerts-title" className="monitor-panel-title"><Bell size={23} aria-hidden="true" />告警状态</CardTitle></CardHeader>
      {incidents.length === 0 ? (
        <div className="monitor-alert-empty">
          <span><Check size={23} strokeWidth={3} aria-hidden="true" /></span>
          <strong>当前无待处理告警</strong>
          <p>如出现服务异常，将在此处显示告警信息。</p>
        </div>
      ) : (
        <div className="monitor-alert-body">
          <p className="monitor-alert-count">{incidents.length} 条待处理告警</p>
          <ul>
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Button type="button" variant="ghost" className="monitor-alert-button" data-tone={incident.severity === 'danger' ? 'unavailable' : 'degraded'}
                  onClick={(event) => onDetails(incident, event.currentTarget)}>
                  <TriangleAlert size={18} aria-hidden="true" />
                  <span><strong>{services[incident.service].name} · {incident.type}</strong><span>{incident.error}</span></span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
