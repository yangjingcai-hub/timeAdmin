import { CheckCircle2, ChevronRight, CircleHelp, TriangleAlert } from 'lucide-react'
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
  return <Badge className="monitor-badge" data-tone={incident.recoveredAt !== null ? 'healthy' : 'unavailable'}>
    {incident.recoveredAt !== null ? '已恢复' : '异常中'}
  </Badge>
}

export function MonitorIncidents({ incidents, onDetails, message, historyStartedAt }: IncidentsProps & {
  message?: string; historyStartedAt?: number
}) {
  return <Card className="monitor-panel monitor-incidents" aria-labelledby="monitor-incidents-title">
    <CardHeader><CardTitle id="monitor-incidents-title" className="monitor-panel-title">
      <TriangleAlert size={23} aria-hidden="true" />最近异常记录 <span>（近 24 小时）</span>
    </CardTitle></CardHeader>
    <Table className="monitor-table" aria-label="最近异常记录">
      <TableHeader><TableRow>
        {['发生时间', '影响服务', '异常类型', '错误信息', '影响范围', '状态', '操作'].map(title => <TableHead key={title}>{title}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>
        {incidents.map(incident => <TableRow key={incident.id}>
          <TableCell><time dateTime={new Date(incident.occurredAt).toISOString()}>{formatCheckTime(incident.occurredAt)}</time></TableCell>
          <TableCell>{services[incident.service].name}</TableCell>
          <TableCell><Badge className="monitor-badge" data-tone={incident.severity === 'danger' ? 'unavailable' : 'warning'}>{incident.type}</Badge></TableCell>
          <TableCell className="monitor-incident-message">{incident.error}</TableCell>
          <TableCell className="monitor-incident-message">{incident.impact ?? '暂未统计'}</TableCell>
          <TableCell><IncidentStatusBadge incident={incident} /></TableCell>
          <TableCell><Button type="button" variant="ghost" size="sm" className="monitor-incident-link"
            aria-label={`查看详情 · ${services[incident.service].name} · ${incident.type}`}
            onClick={event => onDetails(incident, event.currentTarget)}>查看详情</Button></TableCell>
        </TableRow>)}
        {!incidents.length && <TableRow><TableCell colSpan={7} className="monitor-no-incidents">
          {message ?? '近 24 小时内暂无异常记录'}
        </TableCell></TableRow>}
      </TableBody>
    </Table>
    {historyStartedAt !== undefined && <p className="monitor-data-note">每 30 秒检查。记录范围为当前服务进程观察到的结果，始于 {formatCheckTime(historyStartedAt)}。重启后重新记录，已恢复的异常保留 24 小时。</p>}
  </Card>
}

export function MonitorAlerts({ incidents, onDetails, unknown }: IncidentsProps & { unknown: boolean }) {
  const active = incidents.length > 0
  const Icon = active ? TriangleAlert : unknown ? CircleHelp : CheckCircle2
  return <Card className="monitor-alerts" data-tone={active ? 'unavailable' : unknown ? 'unknown' : 'healthy'}
    aria-labelledby="monitor-alerts-title">
    <Icon size={33} aria-hidden="true" />
    <div className="monitor-alert-copy">
      <h2 id="monitor-alerts-title">{active ? `当前有 ${incidents.length} 项待处理告警` : unknown ? '告警状态尚未完全确认' : '当前无待处理告警'}</h2>
      <p>{active ? '存在尚未恢复的服务异常，请查看详情。' : unknown ? '部分监控结果未知，暂时无法确认所有服务的告警状态。' : '如出现新的服务异常，将在此处显示告警信息。'}</p>
    </div>
    {active && <div className="monitor-alert-links">
      {incidents.map(incident => <Button key={incident.id} type="button" variant="ghost" className="monitor-incident-link"
        aria-label={`查看告警详情 · ${services[incident.service].name}`}
        onClick={event => onDetails(incident, event.currentTarget)}>
        {incidents.length > 1 ? services[incident.service].name : ''}查看告警详情<ChevronRight size={16} aria-hidden="true" />
      </Button>)}
    </div>}
  </Card>
}
