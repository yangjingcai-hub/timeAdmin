import * as Dialog from '@radix-ui/react-dialog'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { parseTrialDuration, trialClaimLimit, type TrialRule } from './trial-rule'

interface TrialRuleEditorProps {
  rule: TrialRule
  onClose: () => void
  onConfirm: (rule: TrialRule) => void
  restoreFocus: () => void
}

export function TrialRuleEditor({ rule, onClose, onConfirm, restoreFocus }: TrialRuleEditorProps) {
  const [duration, setDuration] = useState(String(rule.durationDays))
  const [error, setError] = useState('')
  const [unchanged, setUnchanged] = useState(false)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const days = parseTrialDuration(duration)
    if (days === null) {
      setError('请输入大于 0 的整数天数。')
      return
    }
    if (days === rule.durationDays) {
      setUnchanged(true)
      return
    }
    onConfirm({ durationDays: days })
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="detail-overlay" />
        <DetailDrawerContent title="编辑体验规则" description="调整体验时长，领取限制为每个账号一次。"
          placement="center" className="plan-modal trial-rule-modal" restoreFocus={restoreFocus}
          onInteractOutside={(event) => event.preventDefault()}>
          <form className="trial-rule-form" noValidate onSubmit={save}>
            <div className="plan-field">
              <label htmlFor="trial-duration-input">体验时长（天）</label>
              <input id="trial-duration-input" inputMode="numeric" value={duration} autoFocus
                onChange={(event) => { setDuration(event.target.value); setError(''); setUnchanged(false) }}
                aria-invalid={Boolean(error)} aria-describedby={error ? 'trial-duration-error' : undefined} />
              {error && <span id="trial-duration-error" className="plan-field-error" role="alert">{error}</span>}
            </div>
            <label className="plan-field">领取限制<input value={trialClaimLimit} readOnly /></label>
            <p className="plan-local-note">修改保存于当前浏览器，用于本地配置预览。</p>
            {unchanged && <p className="plan-no-changes" role="status">没有需要保存的修改。</p>}
            <footer className="plan-modal-actions">
              <Dialog.Close asChild><Button type="button" variant="ghost" className="plan-secondary-button">取消</Button></Dialog.Close>
              <Button type="submit" className="plan-primary-button">保存修改</Button>
            </footer>
          </form>
        </DetailDrawerContent>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
