import * as Dialog from '@radix-ui/react-dialog'
import { NotebookText } from 'lucide-react'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { paymentMethods, plans, type Order } from './mock-orders'
import { formatAmount } from './order-model'
import { ActivationBadge, PaymentBadge } from './order-table'

interface OrderDetailProps {
  order: Order | null
  onClose: () => void
  restoreFocus: () => void
}

export function OrderDetail({ order, onClose, restoreFocus }: OrderDetailProps) {
  return (
    <Dialog.Root open={order !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        {order && <>
          <Dialog.Overlay className="detail-overlay" />
          <DetailDrawerContent title="订单详情" description="查看此订单的购买信息、支付记录和会员开通状态。" restoreFocus={restoreFocus}>
            <div className="detail-identity">
              <span><NotebookText size={24} aria-hidden="true" /></span>
              <div><strong>{order.id}</strong><p>{order.email}</p></div>
            </div>
            <section className="detail-section" aria-label="购买与开通">
              <h3>购买与开通</h3>
              <dl>
                <div><dt>会员套餐</dt><dd>{plans[order.plan].label}</dd></div>
                <div><dt>订单金额</dt><dd>{formatAmount(order.amountCents)}</dd></div>
                <div><dt>会员开通状态</dt><dd><ActivationBadge status={order.activation} /></dd></div>
              </dl>
            </section>
            <section className="detail-section" aria-label="支付记录">
              <h3>支付记录</h3>
              <dl>
                <div><dt>支付方式</dt><dd>{paymentMethods[order.payment.method]}</dd></div>
                <div><dt>支付状态</dt><dd><PaymentBadge status={order.payment.status} /></dd></div>
                <div><dt>创建时间</dt><dd>{order.createdAt}</dd></div>
                <div><dt>支付完成时间</dt><dd>{order.payment.completedAt ?? '—'}</dd></div>
              </dl>
            </section>
          </DetailDrawerContent>
        </>}
      </Dialog.Portal>
    </Dialog.Root>
  )
}
