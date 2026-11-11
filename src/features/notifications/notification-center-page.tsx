import { Bell, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { notificationCount, notificationsApi, notificationTarget, type AdminNotification, type NotificationPage } from './notification-data'
import { useNotifications } from './notification-provider'
import { NotificationRow } from './notification-row'
import './notifications.css'

const pageSize = 20

export function NotificationCenterPage() {
  const { request } = useAdminAuth()
  const { summary, revision, readRevision, pending, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ path: string; readRevision: number; data: NotificationPage } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const path = `${notificationsApi}?pageSize=${pageSize}&page=${page}&unreadOnly=${unreadOnly}`
  const data = result?.path === path && result.readRevision === readRevision ? result.data : null
  const total = data?.total ?? summary?.total
  const unreadCount = data?.unreadCount ?? summary?.unreadCount
  const filteredCount = unreadOnly ? data?.unreadCount : data?.total

  useEffect(() => {
    const controller = new AbortController()
    setLoadError(false)
    request<NotificationPage>(path, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setResult({ path, readRevision, data: value })
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true)
    })
    return () => controller.abort()
  }, [request, path, revision, readRevision, attempt])

  function changeFilter(onlyUnread: boolean) {
    setUnreadOnly(onlyUnread)
    setPage(1)
    setActionError(false)
  }
  async function openNotification(item: AdminNotification) {
    setActionError(false)
    if (await markRead(item)) navigate(notificationTarget(item))
    else setActionError(true)
  }
  async function readAll() {
    setActionError(false)
    if (!(await markAllRead())) setActionError(true)
  }

  return <>
    <PageHeader title="通知中心" description="查看订单异常与系统告警，追溯通知历史。" />
    <section className="notice-center" aria-label="通知列表" aria-busy={!data && !loadError}>
      <div className="notice-center-toolbar">
        <div className="notice-filters" role="group" aria-label="筛选通知">
          <button type="button" aria-pressed={!unreadOnly} onClick={() => changeFilter(false)}>全部{total !== undefined && `（${notificationCount(total)}）`}</button>
          <button type="button" aria-pressed={unreadOnly} onClick={() => changeFilter(true)}>未读{unreadCount !== undefined && `（${notificationCount(unreadCount)}）`}</button>
        </div>
        <Button type="button" className="notice-read-all" size="sm" disabled={!unreadCount || pending} onClick={() => void readAll()}>
          <Check size={16} aria-hidden="true" />全部标为已读
        </Button>
      </div>
      {loadError && <p className="notice-center-message" role="alert">通知读取失败。
        <Button type="button" variant="ghost" size="sm" onClick={() => setAttempt(value => value + 1)}>重试</Button>
      </p>}
      {actionError && <p className="notice-center-message" role="alert">标记已读失败，请重试。</p>}
      {data?.items.length ? <ul className="notice-center-list">
        {data.items.map(item => <li key={item.id}>
          <button type="button" className="notice-row notice-row-full" data-unread={!item.readAtUtc}
            disabled={pending} onClick={() => void openNotification(item)}><NotificationRow item={item} /></button>
        </li>)}
      </ul> : (!loadError || data) && <div className="notice-empty notice-center-empty" role="status">
        <Bell size={34} aria-hidden="true" />
        <strong>{data ? unreadOnly ? '暂无未读通知' : '暂无通知' : '正在读取通知…'}</strong>
      </div>}
      {data && filteredCount !== undefined && filteredCount > pageSize && <ListPagination total={filteredCount}
        page={data.page} pageCount={Math.ceil(filteredCount / pageSize)} countLabel="条通知"
        navigationLabel="通知列表分页" onPageChange={setPage} />}
    </section>
  </>
}
