import * as Menu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { notificationCount, notificationTarget, type AdminNotification } from './notification-data'
import { useNotifications } from './notification-provider'
import { NotificationRow } from './notification-row'
import './notifications.css'

export function NotificationPoptip() {
  const { summary, unavailable, pending, markRead, refresh } = useNotifications()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [failure, setFailure] = useState(false)
  const navigating = useRef(false)
  const unread = summary?.unreadCount ?? 0

  function goTo(path: string) {
    navigating.current = true
    setOpen(false)
    navigate(path)
  }
  async function openNotification(item: AdminNotification) {
    setFailure(false)
    if (await markRead(item)) goTo(notificationTarget(item))
    else setFailure(true)
  }

  return <Menu.Root open={open} modal={false} onOpenChange={value => { setOpen(value); if (value) { setFailure(false); refresh() } }}>
    <Menu.Trigger asChild>
      <button type="button" className="notice-bell" aria-label={unread ? `通知，${unread} 条未读` : '通知'} title="通知">
        <Bell size={22} aria-hidden="true" />
        {unread > 0 && <span className="notice-bell-count" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
      </button>
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Content className="notice-poptip" sideOffset={12} collisionPadding={12} aria-label="通知"
        onCloseAutoFocus={event => { if (navigating.current) { event.preventDefault(); navigating.current = false } }}>
        <div className="notice-pop-heading"><Menu.Label>通知</Menu.Label>
          {!!summary?.total && <span className="notice-unread-count" data-zero={unread === 0}>{notificationCount(unread)} 条未读</span>}
        </div>
        <Menu.Group className="notice-pop-list" aria-label="最新通知">
          {summary?.items.length ? summary.items.map(item =>
            <Menu.Item key={item.id} className="notice-row notice-row-compact" data-unread={!item.readAtUtc}
              aria-busy={pending} onSelect={event => { event.preventDefault(); if (!pending) void openNotification(item) }}>
              <NotificationRow item={item} compact />
            </Menu.Item>
          ) : <div className="notice-empty" role="status"><Bell size={28} aria-hidden="true" />
            <strong>{unavailable ? '通知暂时无法读取' : summary ? '暂无通知' : '正在读取通知…'}</strong>
          </div>}
        </Menu.Group>
        {failure && <p className="notice-pop-error" role="alert">标记已读失败，请重试。</p>}
        {!failure && unavailable && !!summary?.items.length && <p className="notice-pop-error" role="status">通知同步失败，正在显示上次记录。</p>}
        <Menu.Item className="notice-pop-footer" onSelect={() => goTo('/notifications')}>
          查看全部通知<ChevronRight size={16} aria-hidden="true" />
        </Menu.Item>
        <Menu.Arrow className="notice-pop-arrow" width={14} height={7} />
      </Menu.Content>
    </Menu.Portal>
  </Menu.Root>
}
