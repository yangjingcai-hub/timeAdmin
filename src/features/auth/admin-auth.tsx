import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { ApiError, apiRequest } from '@/lib/api'
import { changeAdminPassword, getAdminSession, signInAdmin, signOutAdmin, type AdminSession, type ChangeAdminPassword } from './admin-api'

type State =
  | { status: 'checking' | 'unavailable' }
  | { status: 'anonymous'; notice?: string; noticeTone?: 'success' }
  | { status: 'authenticated'; session: AdminSession }

type AdminAuth = {
  state: State
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  changePassword(values: ChangeAdminPassword): Promise<void>
  retry(): void
  request<T>(path: string, options?: RequestInit): Promise<T>
}

const AuthContext = createContext<AdminAuth | null>(null)
const logoutEventKey = 'focustime-admin-logout'

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'checking' })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => {
    setState({ status: 'checking' })
    setAttempt(value => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAdminSession(controller.signal).then(session => {
      if (!controller.signal.aborted) setState({ status: 'authenticated', session })
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setState(isUnauthorized(error) ? { status: 'anonymous' } : { status: 'unavailable' })
    })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    const onRestore = (event: PageTransitionEvent) => { if (event.persisted) retry() }
    const onStorage = (event: StorageEvent) => {
      if (event.key === logoutEventKey) retry()
    }
    window.addEventListener('pageshow', onRestore)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('pageshow', onRestore)
      window.removeEventListener('storage', onStorage)
    }
  }, [retry])

  const invalidate = useCallback((expected: State, error?: unknown) => {
    const notice = error instanceof ApiError && error.status === 403
      ? '当前账号没有管理后台访问权限。' : '登录已失效，请重新登录。'
    setState(current => current === expected ? { status: 'anonymous', notice } : current)
  }, [])

  useEffect(() => {
    if (state.status !== 'authenticated') return
    const controller = new AbortController()
    const expiresAt = Date.parse(state.session.expiresAtUtc)
    const expire = () => invalidate(state)
    const timer = window.setTimeout(expire, Math.max(0, expiresAt - Date.now()))
    let checking = false
    const revalidate = async () => {
      if (Date.now() >= expiresAt) return expire()
      if (document.hidden || checking) return
      checking = true
      try {
        await getAdminSession(controller.signal)
      } catch (error) {
        if (!controller.signal.aborted && isUnauthorized(error)) invalidate(state, error)
      } finally {
        checking = false
      }
    }
    const interval = window.setInterval(revalidate, 60_000)
    window.addEventListener('focus', revalidate)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
      window.clearInterval(interval)
      window.removeEventListener('focus', revalidate)
    }
  }, [state, invalidate])

  const request = useCallback(async <T,>(path: string, options?: RequestInit) => {
    try {
      return await apiRequest<T>(path, options)
    } catch (error) {
      if (!options?.signal?.aborted && isUnauthorized(error)) invalidate(state, error)
      throw error
    }
  }, [state, invalidate])

  async function login(email: string, password: string) {
    const session = await signInAdmin(email, password)
    setState({ status: 'authenticated', session })
  }

  function endSession(notice?: string) {
    setState({ status: 'anonymous', notice, noticeTone: notice ? 'success' : undefined })
    try { localStorage.setItem(logoutEventKey, crypto.randomUUID()) } catch { /* Session has already ended. */ }
  }

  async function changePassword(values: ChangeAdminPassword) {
    try {
      await changeAdminPassword(values)
    } catch (error) {
      if (isUnauthorized(error)) invalidate(state, error)
      throw error
    }
    endSession('密码修改成功，请使用新密码重新登录。')
  }

  async function logout() {
    try {
      await signOutAdmin()
    } catch (error) {
      if (!isUnauthorized(error)) throw error
    }
    endSession()
  }

  return <AuthContext.Provider value={{ state, login, logout, changePassword, retry, request }}>{children}</AuthContext.Provider>
}

export function useAdminAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('AdminAuthProvider is required')
  return auth
}

export function AdminSessionStatus() {
  const { state, retry } = useAdminAuth()
  return <main className="admin-session-status">
    {state.status === 'unavailable' ? <>
      <p role="alert">无法连接管理服务，请稍后重试。</p>
      <Button onClick={retry}>重试</Button>
    </> : <p role="status">正在验证登录状态…</p>}
  </main>
}

export function RequireAdministrator() {
  const { state } = useAdminAuth()
  if (state.status === 'authenticated') return <Outlet />
  if (state.status === 'anonymous') return <Navigate to="/login" replace />
  return <AdminSessionStatus />
}
