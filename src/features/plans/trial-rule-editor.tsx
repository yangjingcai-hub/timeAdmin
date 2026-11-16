import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import { maxTrialDays, minTrialDays, parseTrialDuration, trialClaimLimit, trialRulePath, type TrialRule } from './trial-rule'

interface TrialRuleEditorProps {
  onClose: () => void
  onSaved: (rule: TrialRule) => void
  restoreFocus: () => void
}

export function TrialRuleEditor({ onClose, onSaved, restoreFocus }: TrialRuleEditorProps) {
  const { request } = useAdminAuth()
  const [rule, setRule] = useState<TrialRule | null>(null)
  const [duration, setDuration] = useState('')
  const [reload, setReload] = useState(0)
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState(false)
  const [failure, setFailure] = useState('')
  const [needsReload, setNeedsReload] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const days = parseTrialDuration(duration)
  const loading = rule === null && !needsReload
  const canEdit = rule !== null && !needsReload && !saving

  useEffect(() => {
    const controller = new AbortController()
    request<TrialRule>(trialRulePath, { signal: controller.signal }).then(current => {
      if (controller.signal.aborted) return
      setRule(current)
      setDuration(String(current.durationDays))
    }).catch(() => {
      if (controller.signal.aborted) return
      setFailure('体验规则加载失败，请重试。')
      setNeedsReload(true)
    })
    return () => controller.abort()
  }, [request, reload])

  function changeDuration(value: string) {
    setDuration(value)
    setValidationError(false)
    setFailure('')
  }

  function stepDuration(step: number) {
    if (!rule || !canEdit) return
    const next = (days ?? rule.durationDays) + step
    changeDuration(String(Math.max(minTrialDays, Math.min(maxTrialDays, next))))
  }

  function reloadRule() {
    setRule(null)
    changeDuration('')
    setNeedsReload(false)
    setReload(value => value + 1)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rule || !canEdit) return
    if (days === null) {
      setValidationError(true)
      input.current?.focus()
      return
    }
    setSaving(true)
    setFailure('')
    try {
      onSaved(await request<TrialRule>(trialRulePath, {
        method: 'PUT', headers: { 'X-FocusTime-Admin': '1' },
        body: JSON.stringify({ durationDays: days, expectedVersion: rule.version }),
      }))
    } catch (error) {
      if (error instanceof ApiError && error.code === 'trial_rule_version_conflict') {
        setFailure('体验规则已被其他管理员更新，请重新读取后再修改。')
        setNeedsReload(true)
      } else if (error instanceof ApiError && error.status === 400) {
        setValidationError(true)
      } else {
        setFailure('体验规则保存失败，请重试。')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={open => { if (!open && !saving) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="detail-overlay" />
        <Dialog.Content className="detail-surface plan-modal trial-rule-modal" aria-describedby={undefined}
          aria-busy={loading || saving} onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
          onInteractOutside={event => event.preventDefault()}
          onEscapeKeyDown={event => { if (saving) event.preventDefault() }}>
          <header className="plan-modal-header">
            <Dialog.Title>编辑体验规则</Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" className="plan-close" aria-label="关闭" disabled={saving}><X size={19} aria-hidden="true" /></Button>
            </Dialog.Close>
          </header>
          <form className="plan-modal-body" noValidate onSubmit={save}>
            <div className="plan-field">
              <label htmlFor="trial-duration-input">体验时长（天）</label>
              <div className="trial-duration-control" data-invalid={validationError}>
                <input id="trial-duration-input" ref={input} type="number" min={minTrialDays} max={maxTrialDays} step={1}
                  value={duration} placeholder={loading ? '正在读取…' : undefined} disabled={!canEdit}
                  onChange={event => changeDuration(event.target.value)} aria-invalid={validationError}
                  aria-describedby={validationError ? 'trial-claim-limit trial-duration-error' : 'trial-claim-limit'} />
                <div className="trial-duration-steps">
                  <button type="button" aria-label="增加一天" disabled={!canEdit || days === maxTrialDays} onClick={() => stepDuration(1)}><ChevronUp size={16} aria-hidden="true" /></button>
                  <button type="button" aria-label="减少一天" disabled={!canEdit || days === minTrialDays} onClick={() => stepDuration(-1)}><ChevronDown size={16} aria-hidden="true" /></button>
                </div>
              </div>
              {validationError && <span id="trial-duration-error" className="plan-field-error" role="alert">请输入 1～15 的整数天数。</span>}
            </div>
            <p id="trial-claim-limit" className="plan-modal-note"><Info size={17} aria-hidden="true" />{trialClaimLimit}</p>
            {failure && <p className="plan-field-error" role="alert">{failure}</p>}
            {needsReload && <Button type="button" variant="ghost" className="trial-rule-retry" onClick={reloadRule}>重新读取</Button>}
            <footer className="plan-modal-actions">
              <Dialog.Close asChild><Button type="button" variant="ghost" className="plan-secondary-button" disabled={saving}>取消</Button></Dialog.Close>
              <Button type="submit" className="plan-primary-button" disabled={!canEdit}>{saving ? '正在保存…' : '保存'}</Button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
