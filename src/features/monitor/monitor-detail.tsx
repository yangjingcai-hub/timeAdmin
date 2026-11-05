import * as Dialog from '@radix-ui/react-dialog'
import { CircleCheck, CircleDot, RefreshCw, TriangleAlert } from 'lucide-react'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { formatCheckTime, formatDuration, services, type Incident } from './monitor-data'
import { IncidentStatusBadge } from './monitor-incidents'

export function MonitorDetail({ incident, checkedAt, stale, onClose, restoreFocus }: {
  incident: Incident; checkedAt: number; stale: boolean; onClose: () => void; restoreFocus: () => void
}) {
  const service = services[incident.service]
  const recovered = incident.recoveredAt !== null
  const Icon = recovered ? CircleCheck : TriangleAlert
  const events = [
    { time: incident.occurredAt, message: '监测到服务异常', recovered: false },
    ...(incident.recoveredAt !== null ? [{ time: incident.recoveredAt, message: '健康检查确认恢复正常', recovered: true }] : []),
  ]

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="detail-overlay monitor-overlay" />
      <DetailDrawerContent title="异常详情" description="健康检查记录及处理进展" placement="side"
        className="monitor-drawer" restoreFocus={restoreFocus}>
        <section className="monitor-detail-summary" data-tone={recovered ? 'healthy' : 'unavailable'}>
          <span className="monitor-detail-symbol"><Icon size={27} aria-hidden="true" /></span>
          <div><h3>{service.name}{recovered ? '已恢复' : '异常'}</h3>
            <p>{recovered ? '健康检查已确认服务恢复正常。' : stale ? '监控数据暂时无法获取，恢复状态待确认。' : '最近一次健康检查仍未通过。'}</p></div>
          <IncidentStatusBadge incident={incident} />
        </section>
        <section className="monitor-detail-information" aria-labelledby="monitor-incident-info">
          <h3 id="monitor-incident-info">异常信息</h3>
          <dl>
            <div><dt>影响服务</dt><dd>{service.name}</dd></div>
            <div><dt>异常类型</dt><dd>{incident.type}</dd></div>
            <div><dt>开始时间</dt><dd>{formatCheckTime(incident.occurredAt)}</dd></div>
            {incident.recoveredAt !== null
              ? <div><dt>恢复时间</dt><dd>{formatCheckTime(incident.recoveredAt)}</dd></div>
              : <div><dt>持续时间</dt><dd>{formatDuration(checkedAt - incident.occurredAt)}<small>（截至最近检查）</small></dd></div>}
            <div><dt>影响范围</dt><dd>{incident.impact ?? '暂未统计'}</dd></div>
          </dl>
          <p className="monitor-detail-caption">开始与恢复时间为健康检查首次观察到相应状态的时间。</p>
        </section>
        <section className="monitor-detail-error" aria-labelledby="monitor-incident-error">
          <h3 id="monitor-incident-error">错误信息</h3><p>{incident.error}</p>
        </section>
        <section className="monitor-detail-history" aria-labelledby="monitor-incident-history">
          <h3 id="monitor-incident-history">处理记录</h3>
          <ol className="monitor-timeline">
            {events.map(event => <li key={event.time + event.message} data-tone={event.recovered ? 'healthy' : recovered ? 'unknown' : 'unavailable'}>
              {event.recovered ? <CircleCheck size={18} aria-hidden="true" /> : <CircleDot size={18} aria-hidden="true" />}
              <div><time dateTime={new Date(event.time).toISOString()}>{formatCheckTime(event.time)}</time><p>{event.message}</p></div>
            </li>)}
            {!recovered && <li data-tone="unknown"><RefreshCw size={18} aria-hidden="true" />
              <p>{stale ? '检测暂时失败，尚未确认恢复' : '持续监测中，尚未确认恢复'}</p>
            </li>}
          </ol>
        </section>
      </DetailDrawerContent>
    </Dialog.Portal>
  </Dialog.Root>
}
