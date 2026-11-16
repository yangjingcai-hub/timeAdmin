export interface AdminNotification {
  id: string
  kind: 'order' | 'system' | 'api-rate' | 'mail' | 'login' | 'security'
  orderId: string | null
  service: string | null
  description: string
  occurredAtUtc: string
  handledAtUtc: string | null
  readAtUtc: string | null
  lastOccurredAtUtc?: string | null
  occurrenceCount?: number
  resolution?: 'fulfilled' | 'refunded' | 'recovered' | 'recorded' | 'handled' | null
  auditId?: string | null
}

export interface NotificationPage {
  items: AdminNotification[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
  latestUnreadItems?: AdminNotification[]
  selectedItem?: AdminNotification | null
}

export const notificationsApi = '/api/v1/admin/notifications'
export const notificationPageSize = 20
export const notificationPreviewSize = 4

export function notificationTarget(item: AdminNotification) {
  return item.kind === 'order' && item.orderId
    ? `/orders?orderId=${encodeURIComponent(item.orderId)}`
    : `/notifications?noticeId=${encodeURIComponent(item.id)}`
}

export const notificationTitles: Record<AdminNotification['kind'], string> = {
  order: '订单权益异常', system: '系统告警', 'api-rate': 'API 错误率偏高', mail: '注册邮件发送异常',
  login: '集中登录失败', security: '管理员安全操作',
}

export function notificationStatus(item: AdminNotification) {
  if (!item.handledAtUtc) return item.kind === 'order' ? '待处理' : '进行中'
  if (item.resolution === 'fulfilled') return '已发放'
  if (item.resolution === 'refunded') return '已退款'
  if (item.resolution === 'recovered') return '已恢复'
  if (item.resolution === 'recorded') return '已记录'
  return '已处理'
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
