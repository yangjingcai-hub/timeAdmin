import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useMatch, useSearchParams } from 'react-router'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { notificationPageSize, notificationPreviewSize, notificationsApi, type AdminNotification, type NotificationPage } from './notification-data'

interface NotificationState {
  summary: NotificationPage | null
  unavailable: boolean
  pending: boolean
  list: NotificationPage | null
  unreadOnly: boolean
  setUnreadOnly: (value: boolean) => void
  setPage: (page: number) => void
  selectedItem: AdminNotification | null | undefined
  refresh: () => void
  markRead: (item: AdminNotification) => Promise<boolean>
  markAllRead: () => Promise<boolean>
}

const NotificationContext = createContext<NotificationState | null>(null)
const defaultList = { page: 1, unreadOnly: false }
const notificationIdPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { request } = useAdminAuth()
  const inCenter = Boolean(useMatch('/notifications'))
  const [params] = useSearchParams()
  const selectedId = inCenter ? params.get('noticeId') : null
  const validId = selectedId && notificationIdPattern.test(selectedId) ? selectedId : null
  const [view, setView] = useState(defaultList)
  const unreadOnly = inCenter && view.unreadOnly
  const listQuery = inCenter
    ? `pageSize=${notificationPageSize}&page=${view.page}&unreadOnly=${unreadOnly}&includeLatestUnread=true`
    : `pageSize=${notificationPreviewSize}&unreadOnly=true`
  const query = validId ? `${listQuery}&noticeId=${validId}` : listQuery
  const currentQuery = useRef(query)
  const [summary, setSummary] = useState<NotificationPage | null>(null)
  const [result, setResult] = useState<{ query: string; listQuery: string; data: NotificationPage } | null>(null)
  const [failedQuery, setFailedQuery] = useState('')
  const [syncAttempt, setSyncAttempt] = useState(0)
  const [pending, setPending] = useState(false)
  const summaryRequest = useRef<AbortController | null>(null)
  const mutationRequest = useRef<AbortController | null>(null)
  useLayoutEffect(() => { currentQuery.current = query }, [query])

  const apply = useCallback((page: NotificationPage) => {
    setFailedQuery('')
    if (inCenter) setResult({ query, listQuery, data: page })
    const preview = page.latestUnreadItems ?? (page.page === 1 ? page.items : [])
    const unread = page.unreadCount ? preview.filter(item => !item.readAtUtc).slice(0, notificationPreviewSize) : []
    setSummary({ ...page, items: unread, page: 1, pageSize: notificationPreviewSize })
  }, [inCenter, listQuery, query])

  const refresh = useCallback(() => {
    if (summaryRequest.current || mutationRequest.current) return
    const controller = new AbortController()
    summaryRequest.current = controller
    request<NotificationPage>(`${notificationsApi}?${query}`, { signal: controller.signal }).then(page => {
      if (!controller.signal.aborted && currentQuery.current === query) apply(page)
    }).catch(() => {
      if (!controller.signal.aborted && currentQuery.current === query) setFailedQuery(query)
    }).finally(() => {
      if (summaryRequest.current === controller) summaryRequest.current = null
    })
  }, [apply, query, request])

  useEffect(() => {
    let timer: number | undefined
    const refreshVisible = () => {
      window.clearTimeout(timer)
      if (document.hidden) return
      refresh()
      timer = window.setTimeout(refreshVisible, inCenter ? 30_000 : 60_000)
    }
    refreshVisible()
    window.addEventListener('focus', refreshVisible)
    document.addEventListener('visibilitychange', refreshVisible)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', refreshVisible)
      document.removeEventListener('visibilitychange', refreshVisible)
      summaryRequest.current?.abort()
      summaryRequest.current = null
    }
  }, [inCenter, refresh, syncAttempt])
  useEffect(() => { if (!inCenter) setView(defaultList) }, [inCenter])
  useEffect(() => () => { mutationRequest.current?.abort() }, [])

  async function mark(path: string) {
    if (mutationRequest.current) return false
    const controller = new AbortController()
    mutationRequest.current = controller
    summaryRequest.current?.abort()
    summaryRequest.current = null
    setPending(true)
    try {
      const page = await request<NotificationPage>(`${notificationsApi}/${path}?${query}`, {
        method: 'POST', headers: { 'X-FocusTime-Admin': '1' }, signal: controller.signal,
      })
      if (controller.signal.aborted) return false
      if (currentQuery.current === query) apply(page)
      return true
    } catch {
      return false
    } finally {
      mutationRequest.current = null
      if (!controller.signal.aborted) {
        setPending(false)
        if (currentQuery.current !== query) setSyncAttempt(value => value + 1)
      }
    }
  }

  return <NotificationContext.Provider value={{
    summary, unavailable: failedQuery === query, pending, refresh,
    list: inCenter && result?.listQuery === listQuery ? result.data : null,
    selectedItem: selectedId && !validId ? null : result?.query === query ? result.data.selectedItem ?? null : undefined,
    unreadOnly,
    setUnreadOnly: unreadOnly => setView({ page: 1, unreadOnly }),
    setPage: page => setView(current => ({ ...current, page })),
    markRead: item => item.readAtUtc ? Promise.resolve(true) : mark(`${encodeURIComponent(item.id)}/read`),
    markAllRead: () => mark('read-all'),
  }}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('Missing notification provider')
  return context
}
