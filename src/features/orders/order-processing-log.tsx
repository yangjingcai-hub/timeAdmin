import * as Dialog from '@radix-ui/react-dialog'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import type { Order } from './order-types'
import { formatOrderLogTime } from './order-model'

export function OrderProcessingLog({ order, onClose, restoreFocus }: {
  order: Order; onClose: () => void; restoreFocus: () => void
}) {
  const events = order.processingLog
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="detail-overlay order-log-overlay" />
      <DetailDrawerContent title="订单处理日志" description={`后端处理记录 · ${order.id}`} placement="center"
        className="order-log-modal" restoreFocus={restoreFocus}>
        <ol className="order-log-list">
          {events.map(event => <li key={event.id}>
            <time>{formatOrderLogTime(event.occurredAt)}</time><p>{event.message}</p>
          </li>)}
        </ol>
        {!events.length && <p>暂无处理记录。</p>}
      </DetailDrawerContent>
    </Dialog.Portal>
  </Dialog.Root>
}
