import { Bell, ChevronRight } from 'lucide-react'
import { useState } from 'react'
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

export function MonitorIncidents({ incidents, onDetails, healthy, loading, stale }: IncidentsProps & {
  healthy: boolean; loading: boolean; stale: boolean
}) {
  const [showHistory, setShowHistory] = useState(false)
  const visible = showHistory ? incidents : incidents.slice(0, 5)
  return <Card className="monitor-panel monitor-incidents" aria-labelledby="monitor-incidents-title">
    <CardHeader className="monitor-panel-header">
      <CardTitle id="monitor-incidents-title" className="monitor-panel-title"><span className="monitor-panel-icon"><Bell size={23} aria-hidden="true" /></span>告警记录</CardTitle>
      {incidents.length > 5 && <Button type="button" variant="ghost" size="sm" className="monitor-history-button"
        aria-expanded={showHistory} aria-controls="monitor-incident-records" onClick={() => setShowHistory(value => !value)}>
        {showHistory ? '收起历史' : '查看历史'}<ChevronRight size={16} aria-hidden="true" />
      </Button>}
    </CardHeader>
    {visible.length ? <div id="monitor-incident-records" className="monitor-incident-records">
      {stale && <p className="monitor-history-note" role="status">显示上次成功读取的告警记录。</p>}
      <Table className="monitor-table" aria-label="最近异常记录">
      <TableHeader><TableRow>
        {['发生时间', '影响服务', '异常类型', '错误信息', '影响范围', '状态', '操作'].map(title => <TableHead key={title}>{title}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>
        {visible.map(incident => <TableRow key={incident.id}>
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
      </TableBody>
      </Table>
    </div> : <div className="monitor-incident-empty" role="status">
      <Bell size={42} strokeWidth={1.6} aria-hidden="true" />
      <strong>{loading ? '正在获取告警记录…' : stale ? '暂时无法获取告警记录' : healthy ? '暂无告警' : '暂无告警记录'}</strong>
      {healthy && <p>当前系统运行正常，未发现异常。</p>}
    </div>}
  </Card>
}
