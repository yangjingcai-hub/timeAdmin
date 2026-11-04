import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import '@/components/ui/detail-drawer.css'
import { createPlanDraft, getPlanChanges, planDetails, saleStatus, validatePlanDraft, type PlanChange, type PlanConfig, type PlanDraft, type PlanErrors } from './plan-config'

interface PlanEditorProps {
  plan: PlanConfig
  onClose: () => void
  onConfirm: (plan: PlanConfig) => void
  restoreFocus: () => void
}

export function PlanEditor({ plan, onClose, onConfirm, restoreFocus }: PlanEditorProps) {
  const [draft, setDraft] = useState(() => createPlanDraft(plan))
  const [errors, setErrors] = useState<PlanErrors>({})
  const [unchanged, setUnchanged] = useState(false)
  const [proposal, setProposal] = useState<{ plan: PlanConfig; changes: PlanChange[] } | null>(null)
  const priceInput = useRef<HTMLInputElement>(null)
  const durationInput = useRef<HTMLInputElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const name = planDetails[plan.id].name

  useEffect(() => {
    if (proposal) backButton.current?.focus()
    else priceInput.current?.focus()
  }, [proposal])

  function updateDraft<K extends keyof PlanDraft>(field: K, value: PlanDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
    if (field === 'price' || field === 'duration') setErrors((current) => ({ ...current, [field]: undefined }))
    setUnchanged(false)
  }

  function reviewChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    setProposal({ plan: result.value, changes })
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="detail-overlay" />
        <Dialog.Content className="detail-surface plan-modal" role={proposal ? 'alertdialog' : 'dialog'}
          onOpenAutoFocus={(event) => { event.preventDefault(); priceInput.current?.focus() }}
          onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus() }}
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (proposal) {
              event.preventDefault()
              setProposal(null)
            }
          }}>
          <header className="plan-modal-header">
            <div>
              <Dialog.Title>{proposal ? '确认修改' : '编辑套餐'}</Dialog.Title>
              <Dialog.Description>{proposal ? `请核对「${name}」的变更。` : '设置套餐价格、有效期及销售状态。'}</Dialog.Description>
            </div>
            {!proposal && <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="plan-close" aria-label="关闭"><X size={19} aria-hidden="true" /></Button></Dialog.Close>}
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
              {plan.available && !proposal.plan.available && <p className="plan-delist-note">下架后用户无法新购此套餐，已有会员权益不受影响。</p>}
              <footer className="plan-modal-actions">
                <Button ref={backButton} type="button" variant="ghost" className="plan-secondary-button" onClick={() => setProposal(null)}>返回编辑</Button>
                <Button type="button" className="plan-primary-button" onClick={() => onConfirm(proposal.plan)}>确认修改</Button>
              </footer>
            </div>
          ) : (
            <form className="plan-modal-body" noValidate onSubmit={reviewChanges}>
              <label className="plan-field">套餐名称<input value={name} readOnly /></label>
              <div className="plan-field">
                <label htmlFor="plan-price-input">套餐价格（元）</label>
                <input id="plan-price-input" ref={priceInput} inputMode="decimal" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)}
                  aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? 'plan-price-error' : undefined} />
                {errors.price && <span id="plan-price-error" className="plan-field-error" role="alert">{errors.price}</span>}
              </div>
              {plan.id === 'lifetime' ? (
                <label className="plan-field">有效期<input value="永久有效" readOnly /></label>
              ) : (
                <div className="plan-field">
                  <label htmlFor="plan-duration-input">有效期（天）</label>
                  <input id="plan-duration-input" ref={durationInput} inputMode="numeric" value={draft.duration} onChange={(event) => updateDraft('duration', event.target.value)}
                    aria-invalid={Boolean(errors.duration)} aria-describedby={errors.duration ? 'plan-duration-error' : undefined} />
                  {errors.duration && <span id="plan-duration-error" className="plan-field-error" role="alert">{errors.duration}</span>}
                </div>
              )}
              <div className="plan-switches">
                <PlanToggle label="官网推荐" status={draft.recommended ? '开启' : '关闭'} checked={draft.recommended} onChange={(checked) => updateDraft('recommended', checked)} />
                <PlanToggle label="允许购买" status={saleStatus(draft.available)} checked={draft.available} onChange={(checked) => updateDraft('available', checked)} />
              </div>
              {unchanged && <p className="plan-no-changes" role="status">没有需要保存的修改。</p>}
              <footer className="plan-modal-actions">
                <Dialog.Close asChild><Button type="button" variant="ghost" className="plan-secondary-button">取消</Button></Dialog.Close>
                <Button type="submit" className="plan-primary-button">保存修改</Button>
              </footer>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PlanToggle({ label, status, checked, onChange }: { label: string; status: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="plan-toggle">
      <span>{label}</span>
      <span className="plan-toggle-status">{status}</span>
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
