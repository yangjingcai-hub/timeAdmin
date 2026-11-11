import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, Check, CircleAlert, CircleCheck, CircleX, Clock3, Copy, ExternalLink, FileText, Info, RotateCcw, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AccountBadge } from '@/features/users/user-table'
import { membershipPlan } from '@/features/users/user-display'
import { useUserDetailRequest } from '@/features/users/user-detail-api'
import { UserDetailRequestState } from '@/features/users/user-detail-components'
import { toUser, type AdminUserResponse } from '@/features/users/user-api'
import { paymentMethods, paymentStatuses, activationStatuses, type Order } from './order-types'
import { formatAmount } from './order-model'
import { OrderProcessingLog } from './order-processing-log'
import { OrderLinkedUser } from './order-linked-user'
import { ActivationBadge, OrderPlanLabel, PaymentBadge } from './order-table'
import type { AdminOrderResponse } from './order-api'
import { useRefundWindow, refundReasons } from './order-refund-model'
import { OrderRefundModal } from './order-refund-modal'
import { formatOrderLogTime } from './order-model'

const tabs = [{ id: 'logs', label: '处理记录' }, { id: 'user', label: '用户信息' }] as const
function CopyValue({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  return <span className="order-copy-value"><span>{value}</span><button type="button" aria-label={`复制${label}`} title={state === 'copied' ? '已复制' : `复制${label}`}
    onClick={async () => { try { await navigator.clipboard.writeText(value); setState('copied') } catch { setState('failed') } }}>
    {state === 'copied' ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}</button>
    {state !== 'idle' && <small role="status">{state === 'copied' ? '已复制' : '复制失败，请手动复制'}</small>}</span>
}
function Row({ label, children }: { label: string; children: ReactNode }) { return <div><dt>{label}</dt><dd>{children}</dd></div> }

export function OrderDetail({ order, onClose, restoreFocus, loading = false, error = '', onRetry, onRefresh, onRefunded }: {
  order: Order | null; onClose: () => void; restoreFocus: () => void
  loading?: boolean; error?: string; onRetry: () => void; onRefresh: () => void
  onRefunded: (value: AdminOrderResponse) => void
}) {
  const [tab, setTab] = useState<typeof tabs[number]['id']>('logs')
  const [view, setView] = useState<'order' | 'user'>('order')
  const [showRefund, setShowRefund] = useState(false)
  const refundTrigger = useRef<HTMLButtonElement>(null)
  const refund = useRefundWindow(order)
  const scroll = useRef<HTMLDivElement>(null)
  const scrollPosition = useRef(0)
  const userTrigger = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const returnButton = useRef<HTMLButtonElement>(null)
  const userRequest = useUserDetailRequest<AdminUserResponse>(order && (tab === 'user' || view === 'user')
    ? `/api/v1/admin/users/${encodeURIComponent(order.userId)}` : null, order?.userId ?? null, 'id')
  const user = userRequest.data ? toUser(userRequest.data) : null
  const refunded = order?.payment.status === 'refunded'
  const statusTone = refunded ? 'refunded' : order?.activation === 'failed' ? 'failed'
    : order?.payment.status === 'refunding' || order?.payment.status === 'pending' || order?.activation === 'processing' ? 'processing' : order?.payment.status
  const StatusIcon = statusTone === 'failed' ? CircleAlert : statusTone === 'closed' ? CircleX
    : statusTone === 'processing' ? Clock3 : statusTone === 'refunded' ? RotateCcw : CircleCheck
  function showUser() {
    scrollPosition.current = scroll.current?.scrollTop ?? 0
    setView('user')
    window.requestAnimationFrame(() => returnButton.current?.focus())
  }
  function returnToOrder() {
    setView('order')
    window.requestAnimationFrame(() => { if (scroll.current) scroll.current.scrollTop = scrollPosition.current; userTrigger.current?.focus({ preventScroll: true }) })
  }
  function selectTab(index: number) {
    setTab(tabs[index].id)
    document.getElementById(`order-tab-${tabs[index].id}`)?.focus()
  }

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="order-modal-overlay" />
      <Dialog.Content className={`order-detail-modal${view === 'user' ? ' order-account-modal' : !order ? ' order-detail-pending' : ''}`}
        onOpenAutoFocus={event => { event.preventDefault(); closeButton.current?.focus() }}
        onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}>
        <header className="order-modal-header">
          <div className="order-modal-title">{view === 'user' && <ArrowLeft size={20} aria-hidden="true" />}<Dialog.Title>{view === 'user' ? '关联账号详情' : '订单详情'}</Dialog.Title></div>
          {order && view === 'user' && <><span className="order-source">来自订单：<CopyValue value={order.id} label="来源订单编号" /></span>
            <Button ref={returnButton} type="button" variant="ghost" className="order-return-button" onClick={returnToOrder}><ArrowLeft size={16} aria-hidden="true" />返回订单详情</Button></>}
          <Dialog.Close asChild><Button ref={closeButton} type="button" variant="ghost" size="icon" aria-label="关闭订单详情" className="order-modal-close"><X size={21} aria-hidden="true" /></Button></Dialog.Close>
          <Dialog.Description className="sr-only">订单信息、支付记录与处理记录；可查看订单所属用户并返回。</Dialog.Description>
        </header>
        <div ref={scroll} className="order-modal-body" hidden={view !== 'order'}>
          {(loading || error) && <div className="order-detail-request" role={error ? 'alert' : 'status'}>
            <span>{error || '正在读取最新订单详情…'}</span>{error && <Button type="button" variant="ghost" size="sm" onClick={onRetry}>重试</Button>}
          </div>}
          {order && <><div className="order-summary">
            <span className="order-summary-icon"><FileText size={27} aria-hidden="true" /></span>
            <div className="order-summary-copy"><h3><CopyValue value={order.id} label="订单编号" /></h3><p>订单创建时间：{order.createdAt}</p></div>
            <div className="order-summary-actions">
              <span className={`order-combined-status order-tone-${statusTone}`}><StatusIcon size={17} aria-hidden="true" />{paymentStatuses[order.payment.status]}{!refunded && order.activation !== 'notStarted' && ` · ${activationStatuses[order.activation]}`}</span>
              {refunded && order.refundedAmountCents != null ? <span className="order-summary-refund-amount">退款金额：<strong>{formatAmount(order.refundedAmountCents)}</strong></span>
                : refund?.expired ? <span className="order-refund-expired" title={`已超过 3 天退款保障期，截止：${refund.deadline !== null ? formatOrderLogTime(new Date(refund.deadline).toISOString()) : '—'}`}><Info size={14} aria-hidden="true" />已超过退款期限</span>
                : refund?.eligible && <Button ref={refundTrigger} type="button" variant="ghost" className="order-refund-trigger" disabled={loading || !!error} onClick={() => setShowRefund(true)}><RotateCcw size={15} aria-hidden="true" />处理退款</Button>}
            </div>
          </div>
          <div className="order-info-grid">
            <section className="order-info-card"><h3>订单信息</h3><dl>
              <Row label="用户邮箱"><CopyValue value={order.email} label="用户邮箱" /></Row>
              <Row label="会员套餐"><OrderPlanLabel plan={order.plan} /></Row>
              <Row label="订单金额"><strong className="order-detail-amount">{formatAmount(order.amountCents)}</strong></Row>
              <Row label="支付方式"><span className={`order-payment-method order-method-${order.payment.method}`}><i>{order.payment.method === 'alipay' ? '支' : '微'}</i>{paymentMethods[order.payment.method]}</span></Row>
              <Row label="订单状态"><PaymentBadge status={order.payment.status} /></Row>
              <Row label="权益状态"><ActivationBadge status={order.activation} /></Row>
            </dl></section>
            <div className="order-info-stack">
              <section className="order-info-card"><h3>时间信息</h3><dl>
                <Row label="创建时间">{order.createdAt}</Row><Row label="支付完成时间">{order.payment.completedAt ?? '—'}</Row>
                <Row label="权益发放时间">{order.activatedAt ?? '—'}</Row>
                {order.refundedAt && <Row label="退款完成时间">{order.refundedAt}</Row>}
              </dl></section>
              <section className="order-info-card"><h3>支付信息</h3><dl>
                <Row label="平台交易号">{order.transactionId ? <CopyValue value={order.transactionId} label="平台交易号" /> : '—'}</Row>
                <Row label="支付渠道">{order.paymentProvider === 'simulation' ? '开发环境模拟支付' : order.paymentProvider || paymentMethods[order.payment.method]}</Row>
                <Row label="实付金额"><strong className="order-detail-amount">{formatAmount(order.payment.completedAt ? order.amountCents : 0)}</strong></Row>
                {refunded && <Row label="已退金额"><strong>{order.refundedAmountCents != null ? formatAmount(order.refundedAmountCents) : '—'}</strong></Row>}
                {order.refund?.receipt && <Row label="退款凭证">{order.refund.receipt.providerReference}</Row>}
              </dl></section>
            </div>
          </div>
          {order.refund?.receipt && <section className="order-refund-record" aria-label="退款信息"><strong>{order.paymentProvider === 'simulation' ? '模拟退款已记录' : '退款已完成'}</strong>
            <span>退款原因：{refundReasons[order.refund.receipt.reasonCode as keyof typeof refundReasons] ?? order.refund.receipt.reasonCode}</span>
            {order.refund.receipt.note && <span>退款备注：{order.refund.receipt.note}</span>}
            <span>{order.refund.receipt.membershipRevoked ? '本订单对应的会员权益已同时撤销。' : '本次退款未执行会员权益撤销。'}</span>
          </section>}
          {order.exception && <div className="order-detail-alert" role="status"><CircleAlert size={19} aria-hidden="true" /><div><strong>{order.exception.reason}</strong><p>{order.exception.detail}</p></div></div>}
          <section className="order-tabs-card" aria-label="订单补充信息">
            <div className="order-tabs" role="tablist" aria-label="订单详情标签">
              {tabs.map((item, index) => <button key={item.id} type="button" role="tab" id={`order-tab-${item.id}`} aria-controls={`order-panel-${item.id}`}
                aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)}
                onKeyDown={event => { const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
                  if (next >= 0) { event.preventDefault(); selectTab(next) } }}>{item.label}</button>)}
            </div>
            {tabs.map(item => <div key={item.id} role="tabpanel" tabIndex={0} id={`order-panel-${item.id}`} aria-labelledby={`order-tab-${item.id}`} hidden={tab !== item.id} className="order-tab-panel">
              {item.id === 'logs' && (loading ? <p className="order-detail-empty">正在读取处理记录…</p> : error ? <p className="order-detail-empty">处理记录读取失败，请重试</p> : <OrderProcessingLog order={order} />)}
              {item.id === 'user' && (user ? <section className="order-owner"><header><h3>订单所属用户</h3>
                <Button ref={userTrigger} type="button" variant="ghost" onClick={showUser}>查看用户详情<ExternalLink size={15} aria-hidden="true" /></Button></header>
                <dl><Row label="用户邮箱"><CopyValue value={user.email} label="所属用户邮箱" /></Row>
                  <Row label="用户ID"><CopyValue value={user.id} label="用户ID" /></Row>
                  <Row label="账号状态"><AccountBadge status={user.status} /></Row>
                  <Row label="当前会员">{membershipPlan(user.membership) === '—' ? '非会员' : membershipPlan(user.membership)}</Row>
                  <Row label="注册时间">{user.registeredAt}</Row><Row label="最后登录时间">{user.lastLoginAt ?? '—'}</Row></dl>
              </section> : <UserDetailRequestState request={userRequest} />)}
            </div>)}
          </section></>}
        </div>
        {view === 'user' && (user ? <OrderLinkedUser key={user.id} user={user} onMembershipChanged={() => { userRequest.retry(); onRefresh() }} />
          : <UserDetailRequestState request={userRequest} />)}
        {order && showRefund && <OrderRefundModal order={order} onClose={() => setShowRefund(false)} onSuccess={onRefunded}
          restoreFocus={() => { if (refundTrigger.current?.isConnected) refundTrigger.current.focus(); else closeButton.current?.focus() }} />}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
