import * as Dialog from '@radix-ui/react-dialog'
import { CircleAlert, CircleCheck, CircleX, Clock3, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { paymentMethods, type Order } from './order-types'
import { formatAmount, formatOrderLogTime, isOrderException, remainingMembershipDays } from './order-model'
import { OrderProcessingLog } from './order-processing-log'
import { ActivationBadge, OrderPlanLabel, PaymentBadge } from './order-table'

interface OrderDetailProps {
  order: Order | null
  onClose: () => void
  restoreFocus: () => void
  onHandle: (order: Order) => Promise<void>
}

function statusContent(order: Order) {
  if (isOrderException(order)) return {
    title: order.handledAt ? '异常已处理' : '异常订单',
    description: '支付成功，但本订单的会员权益尚未开通',
    icon: CircleAlert, tone: order.handledAt ? 'closed' : 'exception',
  }
  if (order.payment.status === 'paid') return {
    title: '订单已完成', description: '支付成功，会员权益已开通', icon: CircleCheck, tone: 'completed',
  }
  if (order.payment.status === 'pending') return {
    title: '订单待支付', description: '等待用户完成支付', icon: Clock3, tone: 'pending',
  }
  return { title: '订单已关闭', description: '订单已关闭，未完成支付', icon: CircleX, tone: 'closed' }
}

export function OrderDetail({ order, onClose, restoreFocus, onHandle }: OrderDetailProps) {
  const [feedback, setFeedback] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [pending, setPending] = useState(false)
  const logTrigger = useRef<HTMLButtonElement>(null)
  if (!order) return null
  const exception = isOrderException(order)
  const { title, description, icon: Icon, tone } = statusContent(order)
  const remainingDays = remainingMembershipDays(order)

  async function handle() {
    if (!order || pending) return
    setPending(true)
    setFeedback('')
    try { await onHandle(order); setFeedback('会员权益已由后端确认开通，处理日志已保存。') }
    catch (error) { setFeedback(error instanceof Error ? error.message : '开通未完成，请稍后重试。') }
    finally { setPending(false) }
  }

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="detail-overlay" />
      <DetailDrawerContent title="订单详情" description="购买、支付与会员开通记录"
        className="order-detail-drawer" restoreFocus={restoreFocus}>
        <div className="order-detail-status" data-tone={tone}>
          <span><Icon size={29} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p></div>
        </div>
        <section className="order-detail-section order-detail-basics" aria-label="基础信息">
          <dl>
            <div><dt>订单编号</dt><dd className="order-detail-code">{order.id}</dd></div>
            <div className="order-detail-user"><dt>用户邮箱</dt><dd>
              <span>{order.email}</span>
              <Button type="button" variant="ghost" size="sm" className="order-user-link" asChild>
                <Link to={`/users?userId=${encodeURIComponent(order.userId)}`}><ExternalLink size={14} aria-hidden="true" />查看用户详情</Link>
              </Button>
            </dd></div>
          </dl>
        </section>
        <section className="order-detail-section" aria-label="购买信息">
          <h3>购买信息</h3><dl>
            <div><dt>会员套餐</dt><dd><OrderPlanLabel plan={order.plan} /></dd></div>
            <div><dt>订单金额</dt><dd className="order-detail-amount">{formatAmount(order.amountCents)}</dd></div>
            <div><dt>支付方式</dt><dd>{paymentMethods[order.payment.method]}</dd></div>
          </dl>
        </section>
        <section className="order-detail-section" aria-label="支付与开通状态">
          <h3>支付与开通状态</h3><dl>
            <div><dt>支付状态</dt><dd><PaymentBadge status={order.payment.status} /></dd></div>
            <div><dt>会员开通状态</dt><dd><ActivationBadge status={order.activation} exception={exception} /></dd></div>
            <div><dt>创建时间</dt><dd>{order.createdAt}</dd></div>
            <div><dt>支付时间</dt><dd>{order.payment.completedAt ?? '—'}</dd></div>
            <div><dt>会员开通时间</dt><dd>{order.activatedAt ?? '—'}</dd></div>
            {order.grantId && <div><dt>会员权益编号</dt><dd>{order.grantId}</dd></div>}
            {order.membership && <>
              <div><dt>会员有效期</dt><dd>{order.membership.expiresOn
                ? `${order.membership.startsOn} 至 ${order.membership.expiresOn}` : '永久有效'}</dd></div>
              {remainingDays !== null && <div><dt>剩余天数</dt><dd className="order-membership-remaining">{remainingDays} 天</dd></div>}
            </>}
          </dl>
        </section>
        {order.exception && <section className="order-exception-info" aria-labelledby="order-exception-title">
          <h3 id="order-exception-title"><CircleAlert size={17} aria-hidden="true" />异常信息
            {order.handledAt && <Badge className="order-badge order-payment-closed">已处理</Badge>}</h3>
          <dl>
            <div><dt>异常原因</dt><dd>{order.exception.reason}</dd></div>
            <div><dt>发生时间</dt><dd>{order.exception.occurredAt}</dd></div>
            <div><dt>错误代码</dt><dd>{order.exception.code}</dd></div>
            {order.handledAt && <div><dt>处理时间</dt><dd>{formatOrderLogTime(order.handledAt)}</dd></div>}
          </dl>
          <p>{order.exception.detail}</p>
          <div className="order-exception-actions">
            <Button type="button" className="order-reissue-button" disabled={pending} onClick={() => void handle()}>
              <RefreshCw size={15} aria-hidden="true" />{pending ? '正在开通…' : '重新发放权益'}
            </Button>
            <Button ref={logTrigger} type="button" variant="ghost" onClick={() => setShowLogs(true)}>
              <FileText size={15} aria-hidden="true" />查看处理日志
            </Button>
          </div>
          <p className="order-demo-note">由后端重试开通并保存处理记录，成功前会继续保留在异常列表。</p>
        </section>}
        {feedback && <p className="order-action-feedback" role="status">{feedback}</p>}
        {showLogs && <OrderProcessingLog order={order} onClose={() => setShowLogs(false)} restoreFocus={() => logTrigger.current?.focus()} />}
      </DetailDrawerContent>
    </Dialog.Portal>
  </Dialog.Root>
}
