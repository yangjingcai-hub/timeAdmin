import { ChevronRight, Server, TriangleAlert } from 'lucide-react'
import { formatNotificationTime, type AdminNotification } from './notification-data'

export function NotificationRow({ item, compact = false }: { item: AdminNotification; compact?: boolean }) {
  const isOrder = item.kind === 'order'
  const Icon = isOrder ? TriangleAlert : Server
  const time = <time dateTime={item.occurredAtUtc} title={formatNotificationTime(item.occurredAtUtc, false)}>
    {formatNotificationTime(item.occurredAtUtc, compact)}
  </time>
  return <>
    <span className={`notice-icon notice-icon-${item.kind}`}><Icon size={22} aria-hidden="true" /></span>
    <span className="notice-copy">
      <strong>{isOrder ? '订单异常' : '系统异常'}</strong>
      <span className="notice-description">{item.description}</span>
      {compact && time}
    </span>
    {!compact && <span className="notice-metadata">{item.handledAtUtc && <span className="notice-handled">已处理</span>}{time}</span>}
    <span className="notice-dot-slot">
      {!item.readAtUtc && <><i className="notice-dot" aria-hidden="true" /><span className="sr-only">未读</span></>}
    </span>
    {!compact && <ChevronRight className="notice-chevron" size={17} aria-hidden="true" />}
  </>
}
