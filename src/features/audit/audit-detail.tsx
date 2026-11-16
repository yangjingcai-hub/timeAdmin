import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Check, ClipboardList, Copy, Crown, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import '@/components/ui/detail-drawer.css'
import { auditCategories, type AuditChange, type AuditLog } from './audit-data'
import { AuditStatusBadge } from './audit-table'

interface AuditDetailProps {
  log: AuditLog
  onClose: () => void
  restoreFocus: () => void
  loading: boolean
  error: string
  onRetry: () => void
}

export function AuditDetail({ log, onClose, restoreFocus, loading, error, onRetry }: AuditDetailProps) {
  const result = log.result
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const changes = result.status === 'success' ? result.changes.filter(({ before, after }) => before !== after) : []
  const grantChange = changes.find(change => change.field === '会员授权编号')
  const grantId = log.membershipGrantId ?? grantChange?.after ?? grantChange?.before
  const OperationIcon = grantId ? Crown : ClipboardList
  const fields = [
    { label: '操作管理员', value: log.administrator },
    { label: '操作对象', value: log.target },
    { label: '操作类型', value: auditCategories[log.category] },
    { label: '操作来源', value: log.source },
    { label: '操作 IP', value: log.ip ?? '—（未记录）' },
  ]

  async function copyGrantId() {
    if (!grantId) return
    try {
      await navigator.clipboard.writeText(grantId)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="detail-overlay" />
        <Dialog.Content className="detail-surface detail-modal audit-detail"
          onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}>
          <header className="audit-detail-header">
            <span className="audit-outcome-icon"><OperationIcon size={25} aria-hidden="true" /></span>
            <div className="audit-detail-heading">
              <div className="audit-detail-title-row"><Dialog.Title>{log.action}</Dialog.Title>
                <AuditStatusBadge status={result.status} detail /></div>
              <Dialog.Description><span className="sr-only">操作时间 </span>{log.occurredAt}</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="关闭" className="detail-drawer-close"><X size={20} aria-hidden="true" /></Button></Dialog.Close>
          </header>
          <div className="audit-detail-body">
            {(loading || error) && <div className="audit-detail-request" role={error ? 'alert' : 'status'}>{error || '正在读取操作详情…'}
              {error && <Button type="button" variant="ghost" size="sm" onClick={onRetry}>重试</Button>}</div>}
            {result.status === 'failure' && <p className="audit-detail-message" data-result="failure">{result.reason}</p>}
            <section aria-labelledby="audit-info-title" className="audit-detail-section">
              <h3 id="audit-info-title">操作信息</h3>
              <dl className="audit-detail-meta">
                {fields.map(({ label, value }) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
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
              {grantId && <div className="audit-grant">
                <span>会员授权编号</span>
                <strong>{grantId}</strong>
                <Button type="button" variant="ghost" size="icon" aria-label="复制会员授权编号" onClick={() => void copyGrantId()}>
                  {copyStatus === 'copied' ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                </Button>
                {copyStatus !== 'idle' && <small role="status">{copyStatus === 'copied' ? '已复制' : '复制失败，请手动复制'}</small>}
              </div>}
            </section>
            {log.note && (
              <section className="audit-detail-section" aria-labelledby="audit-note-title">
                <h3 id="audit-note-title">备注</h3>
                <p className="audit-detail-message">{log.note}</p>
              </section>
            )}
          </div>
        </Dialog.Content>
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
