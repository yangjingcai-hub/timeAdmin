import { Check, Circle, Clock3, FileText, Minus, X } from 'lucide-react'
import type { Order } from './order-types'
import { formatOrderLogTime } from './order-model'

const eventStyles = {
  success: { label: '成功', icon: Check },
  failed: { label: '失败', icon: X },
  processing: { label: '处理中', icon: Clock3 },
  neutral: { label: '已记录', icon: Circle },
  closed: { label: '已关闭', icon: X },
  recorded: { label: '已记录', icon: FileText },
  revoked: { label: '已撤销', icon: Minus },
}
export function OrderProcessingLog({ order }: { order: Order }) {
  const events = [...order.processingLog].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || (b.sortOrder ?? 0) - (a.sortOrder ?? 0))
  return events.length ? <ol className="order-timeline" aria-label="订单处理时间轴">
    {events.map(event => {
      const status = event.status ?? 'neutral'
      const { label, icon: Icon } = eventStyles[status]
      return <li key={event.id} data-status={status}>
        <span className="order-timeline-icon"><Icon size={17} strokeWidth={status === 'revoked' ? 3 : 2} aria-hidden="true" /></span>
        <div className="order-timeline-content"><div className="order-timeline-title"><strong>{event.title ?? event.message}</strong>
          <span className="order-event-status">{label}</span></div><p>{event.message}</p></div>
        <time dateTime={event.occurredAt}>{formatOrderLogTime(event.occurredAt)}</time>
      </li>
    })}
  </ol> : <p className="order-detail-empty">暂无处理记录</p>
}
