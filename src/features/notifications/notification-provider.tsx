import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { notificationsApi, type AdminNotification, type NotificationPage } from './notification-data'

interface NotificationState {
  summary: NotificationPage | null
  unavailable: boolean
  pending: boolean
  revision: number
  readRevision: number
  refresh: () => void
  markRead: (item: AdminNotification) => Promise<boolean>
  markAllRead: () => Promise<boolean>
}

const NotificationContext = createContext<NotificationState | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { request } = useAdminAuth()
  const [summary, setSummary] = useState<NotificationPage | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [revision, setRevision] = useState(0)
  const [readRevision, setReadRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const summaryRequest = useRef<AbortController | null>(null)
  const mutationRequest = useRef<AbortController | null>(null)

  const refresh = useCallback(() => {
    if (summaryRequest.current || mutationRequest.current) return
    const controller = new AbortController()
    summaryRequest.current = controller
    request<NotificationPage>(`${notificationsApi}?pageSize=3`, { signal: controller.signal }).then(page => {
      if (controller.signal.aborted) return
      setSummary(page)
      setUnavailable(false)
      setRevision(value => value + 1)
    }).catch(() => {
      if (!controller.signal.aborted) setUnavailable(true)
    }).finally(() => {
      if (summaryRequest.current === controller) summaryRequest.current = null
    })
  }, [request])

  useEffect(() => {
    refresh()
    const refreshVisible = () => { if (!document.hidden) refresh() }
    const timer = window.setInterval(refreshVisible, 15_000)
    window.addEventListener('focus', refreshVisible)
    document.addEventListener('visibilitychange', refreshVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshVisible)
      document.removeEventListener('visibilitychange', refreshVisible)
      summaryRequest.current?.abort()
      summaryRequest.current = null
    }
  }, [refresh])
  useEffect(() => () => { mutationRequest.current?.abort() }, [])

  async function mark(path: string) {
    if (mutationRequest.current) return false
    const controller = new AbortController()
    mutationRequest.current = controller
    summaryRequest.current?.abort()
    summaryRequest.current = null
    setPending(true)
    try {
      const page = await request<NotificationPage>(`${notificationsApi}/${path}`, {
        method: 'POST', headers: { 'X-FocusTime-Admin': '1' }, signal: controller.signal,
      })
      if (controller.signal.aborted) return false
      setSummary(page)
      setUnavailable(false)
      setReadRevision(value => value + 1)
      return true
    } catch {
      return false
    } finally {
      mutationRequest.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return <NotificationContext.Provider value={{ summary, unavailable, pending, revision, readRevision, refresh,
    markRead: item => item.readAtUtc ? Promise.resolve(true) : mark(`${encodeURIComponent(item.id)}/read`),
    markAllRead: () => mark('read-all'),
  }}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('Missing notification provider')
  return context
}
