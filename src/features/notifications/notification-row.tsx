import { ChevronRight, MailWarning, Server, ShieldAlert, TriangleAlert } from 'lucide-react'
import { formatNotificationTime, notificationStatus, notificationTitles, type AdminNotification } from './notification-data'

const icons = { order: TriangleAlert, system: Server, 'api-rate': Server, mail: MailWarning, login: ShieldAlert, security: ShieldAlert }

export function NotificationRow({ item, compact = false }: { item: AdminNotification; compact?: boolean }) {
  const Icon = icons[item.kind] ?? Server
  const time = <time dateTime={item.occurredAtUtc} title={formatNotificationTime(item.occurredAtUtc, false)}>
    {formatNotificationTime(item.occurredAtUtc, compact)}
  </time>
  return <>
    <span className={`notice-icon notice-icon-${item.kind}`}><Icon size={22} aria-hidden="true" /></span>
    <span className="notice-copy">
      <strong>{notificationTitles[item.kind] ?? '通知'}</strong>
      <span className="notice-description">{item.description}</span>
      {compact && time}
    </span>
    {!compact && <span className="notice-metadata">
      <span className={item.handledAtUtc ? 'notice-handled' : 'notice-open-status'}>{notificationStatus(item)}</span>{time}
    </span>}
    <span className="notice-dot-slot">
      {!item.readAtUtc && <><i className="notice-dot" aria-hidden="true" /><span className="sr-only">未读</span></>}
    </span>
    {!compact && <ChevronRight className="notice-chevron" size={17} aria-hidden="true" />}
  </>
}
