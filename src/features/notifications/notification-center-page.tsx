import { Bell, Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { notificationCount, notificationPageSize as pageSize, notificationTarget, type AdminNotification } from './notification-data'
import { useNotifications } from './notification-provider'
import { NotificationRow } from './notification-row'
import { NotificationDetail } from './notification-detail'
import './notifications.css'

export function NotificationCenterPage() {
  const { summary, list: data, unavailable: loadError, pending, unreadOnly, setUnreadOnly, setPage,
    selectedItem, refresh, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const noticeId = params.get('noticeId')
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const allNotices = useRef<HTMLButtonElement>(null)
  const [actionError, setActionError] = useState(false)
  const total = data?.total ?? summary?.total
  const unreadCount = data?.unreadCount ?? summary?.unreadCount
  const filteredCount = unreadOnly ? data?.unreadCount : data?.total

  function changeFilter(onlyUnread: boolean) {
    setUnreadOnly(onlyUnread)
    setActionError(false)
  }
  async function openNotification(item: AdminNotification, trigger: HTMLButtonElement) {
    setActionError(false)
    detailTrigger.current = trigger
    if (await markRead(item)) navigate(notificationTarget(item))
    else setActionError(true)
  }
  async function readAll() {
    setActionError(false)
    if (!(await markAllRead())) setActionError(true)
  }

  return <>
    <PageHeader title="通知中心" description="查看订单、系统和安全告警，追溯通知历史。" />
    <section className="notice-center" aria-label="通知列表" aria-busy={!data && !loadError}>
      <div className="notice-center-toolbar">
        <div className="notice-filters" role="group" aria-label="筛选通知">
          <button ref={allNotices} type="button" aria-pressed={!unreadOnly} onClick={() => changeFilter(false)}>全部{total !== undefined && `（${notificationCount(total)}）`}</button>
          <button type="button" aria-pressed={unreadOnly} onClick={() => changeFilter(true)}>未读{unreadCount !== undefined && `（${notificationCount(unreadCount)}）`}</button>
        </div>
        <Button type="button" className="notice-read-all" size="sm" disabled={!unreadCount || pending} onClick={() => void readAll()}>
          <Check size={16} aria-hidden="true" />全部标为已读
        </Button>
      </div>
      {loadError && <p className="notice-center-message" role="alert">通知读取失败。
        <Button type="button" variant="ghost" size="sm" onClick={refresh}>重试</Button>
      </p>}
      {actionError && <p className="notice-center-message" role="alert">标记已读失败，请重试。</p>}
      {data?.items.length ? <ul className="notice-center-list">
        {data.items.map(item => <li key={item.id}>
          <button type="button" className="notice-row notice-row-full" data-unread={!item.readAtUtc}
            disabled={pending} onClick={event => void openNotification(item, event.currentTarget)}><NotificationRow item={item} /></button>
        </li>)}
      </ul> : (!loadError || data) && <div className="notice-empty notice-center-empty" role="status">
        <Bell size={34} aria-hidden="true" />
        <strong>{data ? unreadOnly ? '暂无未读通知' : '暂无通知' : '正在读取通知…'}</strong>
      </div>}
      {data && filteredCount !== undefined && filteredCount > pageSize && <ListPagination total={filteredCount}
        page={data.page} pageCount={Math.ceil(filteredCount / pageSize)} countLabel="条通知"
        navigationLabel="通知列表分页" onPageChange={setPage} />}
    </section>
    {noticeId && <NotificationDetail notice={selectedItem} failed={loadError} onRetry={refresh} onClose={() => {
      const next = new URLSearchParams(params)
      next.delete('noticeId')
      setParams(next, { replace: true })
    }} restoreFocus={() => {
      if (detailTrigger.current?.isConnected) detailTrigger.current.focus()
      else allNotices.current?.focus()
    }} />}
  </>
}
