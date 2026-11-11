export interface AdminNotification {
  id: string
  kind: 'order' | 'system'
  orderId: string | null
  service: 'api' | 'database' | null
  description: string
  occurredAtUtc: string
  handledAtUtc: string | null
  readAtUtc: string | null
}

export interface NotificationPage {
  items: AdminNotification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
}

export const notificationsApi = '/api/v1/admin/notifications'

export function notificationTarget(item: AdminNotification) {
  return item.kind === 'order' && item.orderId
    ? `/orders?orderId=${encodeURIComponent(item.orderId)}`
    : '/monitor'
}

export const notificationCount = new Intl.NumberFormat('zh-CN').format
const notificationTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
})

export function formatNotificationTime(value: string, relative: boolean) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000))
  if (!relative || minutes >= 1440) return notificationTime.format(new Date(value))
  if (minutes >= 60) return `${Math.floor(minutes / 60)} 小时前`
  return minutes ? `${minutes} 分钟前` : '刚刚'
}
