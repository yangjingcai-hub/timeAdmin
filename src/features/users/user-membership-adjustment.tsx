import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Ban, CalendarDays, ChevronDown, CircleAlert, Clock3, Gift, Info, UserRound, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import { plans } from '@/features/orders/order-types'
import { detailPath, formatDetailTime, useUserDetailRequest } from './user-detail-api'
import { UserDetailRequestState, UserDetailStatus, UserDetailSubdialog } from './user-detail-components'
import type { User } from './user-types'
import './user-membership-adjustment.css'

interface EffectiveMembership { isActive: boolean; plan: string | null; grantId: string | null; startsAtUtc: string | null; expiresAtUtc: string | null }
interface AdjustmentContext {
  userId: string; email: string; current: EffectiveMembership
  canGrant: boolean; canRevokeAll: boolean; protectionNote: string | null
}
interface AdjustmentPreview {
  userId: string; operationId: string; action: 'grant' | 'revoke'; plan: string | null; scope: string | null
  reasonCode: string; note: string | null; before: EffectiveMembership; after: EffectiveMembership
  affectedGrantCount: number; expiresAtUtc: string; applied: boolean; version: number | null
}
const grantReasons = { compensation: '用户补偿', promotion: '活动赠送', trial: '免费体验', 'internal-test': '内部测试' }
const revokeReasons = { 'issued-in-error': '发放错误', ineligible: '赠送资格不符', 'test-ended': '内部测试结束', 'refund-request': '用户申请退款', other: '其他原因' }
const modes = [{ id: 'grant', label: '发放会员', icon: Gift }, { id: 'revoke', label: '撤销会员', icon: Ban }] as const
type AdjustmentMode = typeof modes[number]['id']
const membershipLabel = (membership: EffectiveMembership) => membership.isActive
  ? plans[membership.plan as keyof typeof plans]?.label ?? membership.plan ?? '—' : '非会员'
const expiryLabel = (membership: EffectiveMembership) => membership.isActive && membership.plan === 'lifetime'
  ? '永久有效' : formatDetailTime(membership.expiresAtUtc, true)

function EffectPreview({ before, after, title }: { before: EffectiveMembership; after: EffectiveMembership | null; title: string }) {
  return <section className="membership-effect-preview" aria-label={title}>
    <h4><Clock3 size={19} aria-hidden="true" />{title}</h4>
    <div><dl><div><dt>当前会员</dt><dd><UserDetailStatus tone={before.isActive ? 'green' : 'neutral'}>{membershipLabel(before)}</UserDetailStatus></dd></div>
      <div><dt>有效期</dt><dd>{expiryLabel(before)}</dd></div></dl>
      <ArrowRight className="membership-effect-arrow" size={23} aria-hidden="true" />
      <dl><div><dt>操作后状态</dt><dd>{after ? <UserDetailStatus tone={after.isActive ? 'green' : 'neutral'}>{membershipLabel(after)}</UserDetailStatus> : '暂不可执行'}</dd></div>
        <div><dt>有效期</dt><dd>{after ? expiryLabel(after) : '—'}</dd></div></dl>
    </div>
  </section>
}

function adjustmentError(error: unknown) {
  const messages: Record<string, string> = {
    invalid_membership_adjustment: '请检查套餐、原因和备注；选择其他原因时必须填写备注。',
    revocation_confirmation_required: '请核对权益变更并确认撤销。',
    no_active_membership: '该用户当前没有可撤销的会员权益，请刷新后重试。',
    user_email_unconfirmed: '该用户尚未验证邮箱，暂不能调整会员。',
    membership_changed: '会员权益已发生变化，请重新核对并确认。', preview_expired: '确认方案已过期，请重新核对权益变化。',
    operation_id_reused: '该操作编号已被使用，请重新生成确认方案。', preview_actor_mismatch: '该确认方案属于其他管理员，请重新操作。',
    membership_expiry_out_of_range: '当前会员有效期过长，无法继续叠加。',
  }
  return error instanceof ApiError ? messages[error.code ?? ''] ?? (error.status === 403 ? '当前管理员无权执行该操作。' : '暂未确认操作结果，请重试。同一操作编号不会重复变更权益。')
    : '请求结果暂时无法确认，请重试。同一操作编号不会重复变更权益。'
}

export function UserMembershipAdjustment({ user, onClose, onSuccess }: {
  user: User; onClose: () => void; onSuccess: () => void
}) {
  const { request } = useAdminAuth()
  const path = detailPath(user.id, 'membership-adjustments')
  const context = useUserDetailRequest<AdjustmentContext>(path, user.id)
  const [mode, setMode] = useState<AdjustmentMode>('grant')
  const revoking = mode === 'revoke'
  const [plan, setPlan] = useState<keyof typeof plans>('monthly')
  const [drafts, setDrafts] = useState({
    grant: { reason: 'compensation', note: '' },
    revoke: { reason: 'issued-in-error', note: '' },
  })
  const { reason, note } = drafts[mode]
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'preview' | 'apply' | ''>('')
  const [preview, setPreview] = useState<AdjustmentPreview | null>(null)
  const operations = useRef<Partial<Record<AdjustmentMode, string>>>({})
  const submitting = useRef(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const noteInput = useRef<HTMLTextAreaElement>(null)
  const id = useId()
  const data = context.data
  const requiredNote = revoking && reason === 'other'
  const reasonOptions: Record<string, string> = revoking ? revokeReasons : grantReasons
  const allowed = revoking ? data?.canRevokeAll : data?.canGrant
  const blocked = revoking && data && !allowed

  function edit() { delete operations.current[mode]; setError('') }
  function changeMode(next: AdjustmentMode) {
    if (submitting.current || next === mode) return
    setMode(next)
    setError('')
  }
  function handleError(failure: unknown) {
    setError(adjustmentError(failure))
    if (failure instanceof ApiError && ['membership_changed', 'preview_expired', 'operation_id_reused', 'no_active_membership'].includes(failure.code ?? '')) {
      setPreview(null); delete operations.current[mode]; context.retry()
    }
  }
  function validate(result: AdjustmentPreview) {
    if (result.userId !== user.id || result.operationId !== operations.current[mode] || result.action !== mode ||
      (revoking && result.scope !== 'all')) throw new Error('Unexpected adjustment response')
  }
  async function buildPreview() {
    if (submitting.current || !allowed) return
    if (requiredNote && !note.trim()) { setError('选择「其他原因」时必须填写备注。'); noteInput.current?.focus(); return }
    submitting.current = true; setBusy('preview'); setError('')
    operations.current[mode] ??= crypto.randomUUID()
    try {
      const result = await request<AdjustmentPreview>(`${path}/preview`, { method: 'POST', headers: { 'X-FocusTime-Admin': '1' },
        body: JSON.stringify({ operationId: operations.current[mode], action: mode, plan: revoking ? null : plan,
          scope: revoking ? 'all' : null, reasonCode: reason, note: note.trim() || null }) })
      validate(result)
      if (result.applied) onSuccess()
      else setPreview(result)
    } catch (failure) { handleError(failure) }
    finally { submitting.current = false; setBusy('') }
  }
  async function apply() {
    if (submitting.current || !preview) return
    submitting.current = true; setBusy('apply'); setError('')
    try {
      const result = await request<AdjustmentPreview>(`${path}/apply`, {
        method: 'POST', headers: { 'X-FocusTime-Admin': '1' },
        body: JSON.stringify({ operationId: preview.operationId, ...(preview.action === 'revoke' ? { acknowledgeNoRefund: true } : {}) }),
      })
      validate(result)
      if (!result.applied) throw new Error('Unconfirmed adjustment result')
      onSuccess()
    } catch (failure) { handleError(failure) }
    finally { submitting.current = false; setBusy('') }
  }

  return <Dialog.Root open onOpenChange={open => { if (!open && !submitting.current) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="user-subdialog-overlay membership-adjustment-overlay" />
      <Dialog.Content className={`membership-adjustment-modal${revoking ? ' membership-revoke-modal' : ''}`} onOpenAutoFocus={event => {
        previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        event.preventDefault(); closeButton.current?.focus()
      }} onCloseAutoFocus={event => { event.preventDefault(); if (previousFocus.current?.isConnected) previousFocus.current.focus() }}
        onInteractOutside={event => { if (submitting.current) event.preventDefault() }}
        onEscapeKeyDown={event => { event.stopPropagation(); if (submitting.current) event.preventDefault() }}>
        <header className="membership-adjustment-heading"><Dialog.Title>调整会员</Dialog.Title>
          <Dialog.Description className="sr-only">为当前用户发放或撤销会员权益，核对调整方案后执行。</Dialog.Description>
          <Dialog.Close asChild><Button ref={closeButton} type="button" variant="ghost" size="icon" disabled={!!busy} aria-label="关闭调整会员"><X size={22} aria-hidden="true" /></Button></Dialog.Close>
        </header>
        <div className="membership-adjustment-profile"><span className="membership-adjustment-avatar"><UserRound size={38} strokeWidth={1.7} aria-hidden="true" /></span>
          <div><strong>{data?.email ?? user.email}</strong><p>用户ID：<span title={user.id}>{user.id}</span></p></div>
          {data && <div className="membership-adjustment-current"><UserDetailStatus tone={data.current.isActive ? 'green' : 'neutral'}>当前：{membershipLabel(data.current)}</UserDetailStatus>
            {data.current.isActive && <p>有效期至：{expiryLabel(data.current)}</p>}</div>}
        </div>
        <div className="membership-adjustment-body">
          <div className="membership-adjustment-tabs" role="tablist" aria-label="会员调整方式" onKeyDown={event => {
            if (submitting.current || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next = event.key === 'Home' ? 'grant' : event.key === 'End' ? 'revoke' : revoking ? 'grant' : 'revoke'
            changeMode(next)
            event.currentTarget.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)?.focus()
          }}>
            {modes.map(({ id: value, label, icon: Icon }) => <button key={value} type="button" role="tab" id={`${id}-${value}`}
              data-mode={value} aria-controls={`${id}-panel`} aria-selected={mode === value} tabIndex={mode === value ? 0 : -1}
              disabled={!!busy} onClick={() => changeMode(value)}><Icon size={19} aria-hidden="true" />{label}</button>)}
          </div>
          <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${mode}`}>
            {!data ? <UserDetailRequestState request={context} /> : <form id={`${id}-form`} noValidate onSubmit={event => { event.preventDefault(); void buildPreview() }}>
              {!revoking && <>
                <div className="membership-adjustment-field"><label htmlFor={`${id}-plan`}>会员套餐</label>
                  <div className="membership-adjustment-select"><select id={`${id}-plan`} value={plan} disabled={!!busy}
                    onChange={event => { setPlan(event.target.value as keyof typeof plans); edit() }}>
                    {Object.entries(plans).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                  </select><ChevronDown size={19} aria-hidden="true" /></div>
                </div>
                <div className="membership-adjustment-field"><span className="membership-field-label" id={`${id}-expiry-label`}>到期时间</span>
                  <output className="membership-adjustment-expiry" aria-labelledby={`${id}-expiry-label`}>
                    {plan === 'lifetime' ? '永久有效' : '由系统计算，确认前可核对'}<CalendarDays size={17} aria-hidden="true" />
                  </output>
                </div>
              </>}
              <div className="membership-adjustment-field"><label htmlFor={`${id}-reason`}>{revoking ? '撤销原因' : '调整原因'}</label>
                <div className="membership-adjustment-select"><select id={`${id}-reason`} value={reason} required disabled={!!busy || !!blocked} onChange={event => {
                  const value = event.target.value
                  setDrafts(current => ({ ...current, [mode]: { ...current[mode], reason: value } }))
                  edit()
                }}>
                  {Object.entries(reasonOptions).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select><ChevronDown size={19} aria-hidden="true" /></div>
              </div>
              <div className="membership-adjustment-field membership-adjustment-note"><label htmlFor={`${id}-note`}>备注<span>{requiredNote ? '（必填）' : '（选填）'}</span></label>
                <textarea id={`${id}-note`} ref={noteInput} value={note} maxLength={400} disabled={!!busy || !!blocked} required={requiredNote}
                  aria-invalid={requiredNote && !!error && !note.trim()} placeholder="填写补充说明…" onChange={event => {
                    const value = event.target.value
                    setDrafts(current => ({ ...current, [mode]: { ...current[mode], note: value } }))
                    edit()
                  }} />
              </div>
              <p className="membership-adjustment-hint"><Info size={18} aria-hidden="true" />{revoking
                ? '撤销适用于该用户的全部有效会员权益，包括自行购买的会员。撤销不等于退款。' : '发放后立即生效，限时权益按现有有效期延长。'}</p>
              {blocked && <p className="membership-adjustment-error" role="status">{!data.canGrant ? '该用户尚未验证邮箱，暂不能撤销会员。' : '该用户当前没有可撤销的会员权益。'}</p>}
              {!revoking && !data.canGrant && data.protectionNote && <p className="membership-adjustment-protection"><CircleAlert size={17} aria-hidden="true" />{data.protectionNote}</p>}
            </form>}
            {error && !preview && <p className="membership-adjustment-error" role="alert">{error}</p>}
          </div>
        </div>
        <footer className="membership-adjustment-actions">
          <Dialog.Close asChild><Button type="button" variant="ghost" disabled={!!busy}>取消</Button></Dialog.Close>
          <Button type="submit" form={`${id}-form`} disabled={!!busy || !allowed} className={revoking ? 'user-subpage-danger' : 'membership-adjustment-primary'}>
            {busy === 'preview' ? '正在核对…' : revoking ? '核对撤销' : '确认发放'}
          </Button>
        </footer>
        {preview && <UserDetailSubdialog title={revoking ? '确认撤销会员' : '确认发放会员'}
          description={`请核对 ${data?.email ?? user.email} 的权益变化。确认后由服务器执行。`} confirmation busy={busy === 'apply'}
          confirmLabel={revoking ? '确认撤销' : '确认发放'} primary={!revoking}
          className="membership-adjustment-confirmation" overlayClassName="membership-adjustment-confirm-overlay" onClose={() => { setPreview(null); setError('') }} onConfirm={() => void apply()}>
          <EffectPreview before={preview.before} after={preview.after} title="操作前后权益变化" />
          <dl className="membership-confirm-summary">
            <div><dt>{revoking ? '撤销范围' : '发放套餐'}</dt><dd>{revoking ? '全部有效会员权益' : plans[preview.plan as keyof typeof plans]?.label ?? preview.plan}</dd></div>
            <div><dt>操作原因</dt><dd>{reasonOptions[preview.reasonCode] ?? preview.reasonCode}</dd></div>
            {preview.note && <div><dt>备注</dt><dd>{preview.note}</dd></div>}
            <div><dt>影响授权</dt><dd>{preview.affectedGrantCount} 条</dd></div>
            <div><dt>确认有效期</dt><dd>{formatDetailTime(preview.expiresAtUtc, true)}</dd></div>
          </dl>
          {revoking ? <p className="membership-confirm-revoke"><CircleAlert size={18} aria-hidden="true" />
            撤销不等于退款。确认后包括购买所得在内的会员权益将失效，已支付款项不会退回。</p>
            : <>
              {preview.before.isActive && <p className="membership-confirm-note">已按现有有效权益计算发放结果；原有授权和历史订单会被保留。</p>}
              <p className="membership-confirm-note">本次为管理员赠送，不会生成支付订单。</p>
            </>}
          {error && <p className="membership-adjustment-error" role="alert">{error}</p>}
        </UserDetailSubdialog>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
