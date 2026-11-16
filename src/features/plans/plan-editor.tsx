import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Info, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import '@/components/ui/detail-drawer.css'
import { createPlanDraft, formatPlanDuration, getPlanChanges, planDetails, validatePlanDraft, type PlanChange, type PlanConfig, type PlanDraft, type PlanErrors } from './plan-config'

interface PlanEditorProps {
  plan: PlanConfig
  onClose: () => void
  onConfirm: (plan: PlanConfig) => Promise<void>
  restoreFocus: () => void
}

export function PlanEditor({ plan, onClose, onConfirm, restoreFocus }: PlanEditorProps) {
  const [draft, setDraft] = useState(() => createPlanDraft(plan))
  const [errors, setErrors] = useState<PlanErrors>({})
  const [unchanged, setUnchanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState('')
  const [proposal, setProposal] = useState<{ plan: PlanConfig; changes: PlanChange[] } | null>(null)
  const priceInput = useRef<HTMLInputElement>(null)
  const durationInput = useRef<HTMLInputElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const name = planDetails[plan.id].name
  const monthly = plan.id === 'monthly'

  useEffect(() => {
    if (proposal) backButton.current?.focus()
    else priceInput.current?.focus()
  }, [proposal])

  function updateDraft<K extends keyof PlanDraft>(field: K, value: PlanDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setUnchanged(false)
    setFailure('')
  }

  function reviewChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const result = validatePlanDraft(plan, draft)
    if ('errors' in result) {
      setErrors(result.errors)
      if (result.errors.price) priceInput.current?.focus()
      else durationInput.current?.focus()
      return
    }

    const changes = getPlanChanges(plan, result.value)
    if (changes.length === 0) {
      setUnchanged(true)
      return
    }
    if (monthly) void save(result.value)
    else setProposal({ plan: result.value, changes })
  }

  async function save(updated: PlanConfig) {
    if (saving) return
    setSaving(true); setFailure('')
    try { await onConfirm(updated) }
    catch (error) { setFailure(error instanceof Error ? error.message : '保存失败，请稍后重试。') }
    finally { setSaving(false) }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="detail-overlay" />
        <Dialog.Content className="detail-surface plan-modal" role={proposal ? 'alertdialog' : 'dialog'} aria-busy={saving}
          onOpenAutoFocus={(event) => { event.preventDefault(); priceInput.current?.focus() }}
          onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus() }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (proposal || saving) {
              event.preventDefault()
              if (!saving) setProposal(null)
            }
          }}>
          <header className="plan-modal-header">
            <div>
              <Dialog.Title>{proposal ? '确认修改' : `编辑${name}`}</Dialog.Title>
              <Dialog.Description>{proposal ? `请核对「${name}」的变更。` :
                plan.id === 'annual' ? '修改套餐价格和有效期。' : '修改套餐价格，其他规则为固定配置。'}</Dialog.Description>
            </div>
            {!proposal && <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="plan-close" aria-label="关闭" disabled={saving}><X size={19} aria-hidden="true" /></Button></Dialog.Close>}
          </header>

          {proposal ? (
            <div className="plan-modal-body">
              <dl className="plan-changes">
                {proposal.changes.map(({ label, before, after }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd><span>{before}</span><ArrowRight size={15} aria-hidden="true" /><span className="sr-only">改为</span><strong>{after}</strong></dd>
                  </div>
                ))}
              </dl>
              <footer className="plan-modal-actions">
                <Button ref={backButton} type="button" variant="ghost" className="plan-secondary-button" disabled={saving} onClick={() => { setProposal(null); setFailure('') }}>返回编辑</Button>
                <Button type="button" className="plan-primary-button" disabled={saving} onClick={() => void save(proposal.plan)}>{saving ? '正在保存…' : '确认修改'}</Button>
              </footer>
              {failure && <p className="plan-field-error" role="alert">{failure}</p>}
            </div>
          ) : (
            <form className="plan-modal-body" noValidate onSubmit={reviewChanges}>
              <div className="plan-field">
                <label htmlFor="plan-price-input">套餐价格（元）</label>
                <input id="plan-price-input" ref={priceInput} inputMode="decimal" value={draft.price} disabled={saving} onChange={(event) => updateDraft('price', event.target.value)}
                  aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? 'plan-price-error' : undefined} />
                {errors.price && <span id="plan-price-error" className="plan-field-error" role="alert">{errors.price}</span>}
              </div>
              {plan.id === 'annual' ? (
                <div className="plan-field">
                  <label htmlFor="plan-duration-input">有效期（天）</label>
                  <input id="plan-duration-input" ref={durationInput} inputMode="numeric" value={draft.duration} onChange={(event) => updateDraft('duration', event.target.value)}
                    aria-invalid={Boolean(errors.duration)} aria-describedby={errors.duration ? 'plan-duration-error' : undefined} />
                  {errors.duration && <span id="plan-duration-error" className="plan-field-error" role="alert">{errors.duration}</span>}
                </div>
              ) : (
                <dl className="plan-field">
                  <dt>套餐有效期</dt>
                  <dd className="plan-fixed-duration">{monthly ? '30 天' : formatPlanDuration(plan.durationDays)}</dd>
                </dl>
              )}
              <p className="plan-modal-note plan-order-note"><Info size={17} aria-hidden="true" />修改仅对新订单生效，不影响已购会员权益。</p>
              {unchanged && <p className="plan-no-changes" role="status">没有需要保存的修改。</p>}
              {failure && <p className="plan-field-error" role="alert">{failure}</p>}
              <footer className="plan-modal-actions">
                <Dialog.Close asChild><Button type="button" variant="ghost" className="plan-secondary-button" disabled={saving}>取消</Button></Dialog.Close>
                <Button type="submit" className="plan-primary-button" disabled={saving}>{saving ? '正在保存…' : '保存修改'}</Button>
              </footer>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
