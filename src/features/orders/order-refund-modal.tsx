import * as Dialog from '@radix-ui/react-dialog'
import { Check, ChevronDown, CircleAlert, Info, Layers, Plus, Undo2, X } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/features/auth/admin-auth'
import type { AdminOrderResponse } from './order-api'
import { formatAmount, formatOrderLogTime } from './order-model'
import { refundError, refundReasons, useRefundWindow } from './order-refund-model'
import { plans, type Order } from './order-types'

export function OrderRefundModal({ order, onClose, onSuccess, restoreFocus }: {
  order: Order; onClose: () => void; onSuccess: (value: AdminOrderResponse) => void; restoreFocus: () => void
}) {
  const { request } = useAdminAuth()
  const [reason, setReason] = useState<keyof typeof refundReasons>('within-guarantee')
  const [note, setNote] = useState('')
  const [noteExpanded, setNoteExpanded] = useState(false)
  const noteId = useId()
  const [failure, setFailure] = useState('')
  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const operation = useRef<{ key: string; id: string } | null>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const refund = useRefundWindow(order)!
  const supported = order.refund?.supported === true
  const validAmount = Number.isSafeInteger(order.amountCents) && order.amountCents > 0
  const canSubmit = refund.eligible && supported && validAmount && !pending
  const hours = Math.ceil(refund.remaining / 3600000)
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (!validAmount) { setFailure('订单支付金额异常，不能提交退款。'); return }
    if (!refund.eligible || !supported) { setFailure(refund.expired ? '已超过 72 小时退款期限。' : '当前订单不能提交退款。'); return }
    const values = { amountFen: order.amountCents, reasonCode: reason, note: note.trim() || null, revokeMembership: true }
    const key = JSON.stringify(values)
    if (operation.current?.key !== key) operation.current = { key, id: crypto.randomUUID() }
    submitting.current = true; setPending(true); setFailure('')
    try {
      const response = await request<AdminOrderResponse>(`/api/v1/admin/orders/${encodeURIComponent(order.orderId)}/refund`, {
        method: 'POST', headers: { 'X-FocusTime-Admin': '1' }, body: JSON.stringify({ operationId: operation.current.id, ...values }),
      })
      if (response.order.id.toLowerCase() !== order.orderId.toLowerCase() || response.order.status !== 'refunded' || !response.refund?.receipt)
        throw new Error('Unconfirmed refund response')
      onSuccess(response); onClose()
    } catch (error) { setFailure(refundError(error)) }
    finally { submitting.current = false; setPending(false) }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !submitting.current) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="order-refund-overlay" />
      <Dialog.Content className="order-refund-modal" onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus() }}
        onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
        onInteractOutside={event => { if (submitting.current) event.preventDefault() }}
        onEscapeKeyDown={event => { event.stopPropagation(); if (submitting.current) event.preventDefault() }}>
        <header className="order-refund-header"><Dialog.Title>处理退款</Dialog.Title>
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" disabled={pending} aria-label="关闭退款弹窗"><X size={20} aria-hidden="true" /></Button></Dialog.Close>
          <Dialog.Description className="sr-only">确认全额退款及退款原因。退款成功后自动撤销本订单对应的会员权益，可添加退款备注。</Dialog.Description>
        </header>
        <form onSubmit={event => void confirm(event)} className="order-refund-form">
          <div className="order-refund-body">
            <div className={`order-refund-notice${refund.expired ? ' is-expired' : ''}`} role="status" title="退款期限从支付完成时间起计算，共 72 小时。">
              <Info size={23} aria-hidden="true" /><div><strong>{refund.expired ? '已超过退款期限' : order.payment.status === 'refunded' ? '该订单已退款' : '支持 3 天无理由退款'}</strong>
                <p>退款截止：{refund.deadline !== null ? formatOrderLogTime(new Date(refund.deadline).toISOString()).slice(0, 16) : '—'}{refund.eligible && `（剩余约 ${hours} 小时）`}</p></div>
            </div>
            <section className="order-refund-section" aria-labelledby="refund-order-heading">
              <h3 id="refund-order-heading"><Layers size={22} aria-hidden="true" />订单信息</h3>
              <dl className="order-refund-summary">
                <div><dt>会员套餐</dt><dd>{plans[order.plan].label}</dd></div>
                <div><dt>支付金额</dt><dd><strong>{formatAmount(order.amountCents)}</strong></dd></div>
              </dl>
            </section>
            <section className="order-refund-section" aria-labelledby="refund-info-heading">
              <h3 id="refund-info-heading"><Undo2 size={22} aria-hidden="true" />退款信息</h3>
              <div className="order-refund-fields">
                <div className="order-refund-amount"><span>退款金额</span><div><output aria-label="退款金额">{formatAmount(order.amountCents)}</output><p>全额退款 · 与订单支付金额一致</p></div></div>
                <label className="order-refund-field"><span>退款原因</span><span className="order-refund-select"><select aria-label="退款原因" value={reason} disabled={pending} onChange={event => setReason(event.target.value as keyof typeof refundReasons)}>
                  {Object.entries(refundReasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select><ChevronDown size={17} aria-hidden="true" /></span></label>
                <button type="button" className="order-refund-note-toggle" aria-expanded={noteExpanded} aria-controls={noteId} disabled={pending} onClick={() => setNoteExpanded(value => !value)}>
                  {noteExpanded ? <ChevronDown size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{noteExpanded ? '收起退款备注' : '添加退款备注（选填）'}
                </button>
                {noteExpanded && <div className="order-refund-note" id={noteId}><textarea autoFocus aria-label="退款备注" placeholder="请输入退款备注（选填）" maxLength={200} value={note} disabled={pending} onChange={event => setNote(event.target.value)} /><small>{note.length} / 200</small></div>}
              </div>
            </section>
            <div className="order-refund-effect"><span className="order-refund-effect-icon"><Check size={16} strokeWidth={3} aria-hidden="true" /></span><div><p>退款成功后将自动撤销本订单对应的会员权益</p>
              {order.paymentProvider === 'simulation' && <small>模拟支付订单，仅记录模拟退款，不发生实际资金划转。</small>}</div>
            </div>
            {!supported && <p className="order-refund-error" role="alert"><CircleAlert size={16} aria-hidden="true" />该支付渠道尚未接入退款，暂不能提交。</p>}
            {failure && <p className="order-refund-error" role="alert"><CircleAlert size={16} aria-hidden="true" />{failure}</p>}
          </div>
          <footer><Button ref={cancel} type="button" variant="ghost" disabled={pending} onClick={onClose}>取消</Button>
            <Button type="submit" disabled={!canSubmit} className="order-refund-confirm">{pending ? '正在退款…' : '确认退款'}</Button></footer>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
