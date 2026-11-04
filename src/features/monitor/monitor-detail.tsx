import * as Dialog from '@radix-ui/react-dialog'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { errorRateLabel, formatCheckTime, formatLatency, services, type Incident, type ServiceCheck } from './monitor-data'
import { IncidentStatusBadge } from './monitor-incidents'
import { ServiceStatusBadge } from './monitor-services'

export type MonitorSelection = { kind: 'service'; check: ServiceCheck; checkedAt: number } | { kind: 'incident'; incident: Incident }

export function MonitorDetail({ selection, onClose, restoreFocus }: { selection: MonitorSelection; onClose: () => void; restoreFocus: () => void }) {
  const isService = selection.kind === 'service'
  const service = services[isService ? selection.check.id : selection.incident.service]

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="detail-overlay" />
        <DetailDrawerContent placement="center" title={isService ? '服务详情' : '异常详情'}
          description={isService ? service.description : selection.incident.type} restoreFocus={restoreFocus}>
          <section className="detail-section monitor-detail-section" aria-label={service.name}>
            <h3>{service.name}</h3>
            {isService ? (
              <dl>
                <div><dt>当前状态</dt><dd><ServiceStatusBadge status={selection.check.status} /></dd></div>
                <div><dt>最近检查</dt><dd>{formatCheckTime(selection.checkedAt)}</dd></div>
                <div><dt>{selection.check.id === 'database' ? '连接延迟' : '响应时间'}</dt><dd>{formatLatency(selection.check.latencyMs)}</dd></div>
                <div><dt>错误率</dt><dd>{errorRateLabel(selection.check.errorRate)}</dd></div>
                <div><dt>检查结果</dt><dd>{selection.check.note}</dd></div>
              </dl>
            ) : (
              <dl>
                <div><dt>发生时间</dt><dd>{formatCheckTime(selection.incident.occurredAt)}</dd></div>
                <div><dt>错误信息</dt><dd>{selection.incident.error}</dd></div>
                <div><dt>影响范围</dt><dd>{selection.incident.impact}</dd></div>
                <div><dt>当前状态</dt><dd><IncidentStatusBadge incident={selection.incident} /></dd></div>
                {selection.incident.recoveredAt !== null && <div><dt>恢复时间</dt><dd>{formatCheckTime(selection.incident.recoveredAt)}</dd></div>}
              </dl>
            )}
          </section>
        </DetailDrawerContent>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
