import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, CalendarDays, Check, Layers3, MapPin, Monitor, Target, UserRound, X } from 'lucide-react'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { Button } from '@/components/ui/button'
import { auditCategories, type AuditChange, type AuditLog } from './audit-data'
import { AuditStatusBadge } from './audit-table'

interface AuditDetailProps {
  log: AuditLog
  docked: boolean
  onClose: () => void
  restoreFocus: () => void
  loading: boolean
  error: string
  onRetry: () => void
}

export function AuditDetail({ log, docked, onClose, restoreFocus, loading, error, onRetry }: AuditDetailProps) {
  const result = log.result
  const succeeded = result.status === 'success'
  const OutcomeIcon = succeeded ? Check : X
  const changes = succeeded ? result.changes.filter(({ before, after }) => before !== after) : []
  const fields = [
    { label: '操作时间', value: log.occurredAt, icon: CalendarDays },
    { label: '操作管理员', value: log.administrator, icon: UserRound },
    { label: '操作类型', value: auditCategories[log.category], icon: Layers3 },
    { label: '操作对象', value: log.target, icon: Target },
    { label: '操作来源', value: log.source, icon: Monitor },
    { label: '操作 IP', value: log.ip ?? '—（未记录）', icon: MapPin },
  ]

  return (
    <Dialog.Root open modal={!docked} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        {!docked && <Dialog.Overlay className="detail-overlay" />}
        <DetailDrawerContent className={docked ? 'audit-detail audit-detail-docked' : 'audit-detail'} title="操作详情" description="只读查看本次操作的基本信息、变更和执行结果。"
          restoreFocus={restoreFocus} onInteractOutside={(event) => { if (docked) event.preventDefault() }}>
          {(loading || error) && <div className="audit-detail-request" role={error ? 'alert' : 'status'}>{error || '正在读取操作详情…'}
            {error && <Button type="button" variant="ghost" size="sm" onClick={onRetry}>重试</Button>}</div>}
          <section aria-label="基础信息" className="audit-detail-basic">
            <div className="audit-detail-outcome">
              <span className="audit-outcome-icon" data-result={result.status}><OutcomeIcon size={24} strokeWidth={2.8} aria-hidden="true" /></span>
              <h3>{log.action}</h3>
              <AuditStatusBadge status={result.status} detail />
            </div>
            <dl className="audit-detail-meta">
              {fields.map(({ label, value, icon: Icon }) => (
                <div key={label}><dt><Icon size={17} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </section>
          <section className="audit-detail-section" aria-labelledby="audit-changes-title">
            <h3 id="audit-changes-title">变更内容</h3>
            {changes.length ? (
              <div className="audit-comparison">
                <ChangeColumn title="变更前" changes={changes} side="before" />
                <ArrowRight className="audit-change-arrow" size={19} aria-hidden="true" />
                <ChangeColumn title="变更后" changes={changes} side="after" />
              </div>
            ) : <p className="audit-detail-message">该记录未保存字段级变更明细。</p>}
          </section>
          <section className="audit-detail-section" aria-labelledby="audit-result-title">
            <h3 id="audit-result-title">操作结果</h3>
            <p className="audit-detail-message" data-result={result.status}>{succeeded ? '执行成功。' : `执行失败：${result.reason}`}</p>
          </section>
          {log.note && (
            <section className="audit-detail-section" aria-labelledby="audit-note-title">
              <h3 id="audit-note-title">备注</h3>
              <p className="audit-detail-message">{log.note}</p>
            </section>
          )}
        </DetailDrawerContent>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ChangeColumn({ title, changes, side }: { title: string; changes: readonly AuditChange[]; side: 'before' | 'after' }) {
  return (
    <div className={`audit-change-column audit-change-${side}`}>
      <h4>{title}</h4>
      <dl>{changes.map((change) => <div key={change.field}><dt>{change.field}</dt><dd>{change[side] ?? '—'}</dd></div>)}</dl>
    </div>
  )
}
