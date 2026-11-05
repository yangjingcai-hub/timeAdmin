import { Clock, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAdminAuth } from './admin-auth'
import './login.css'

function loginError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return '管理员账号或密码错误。'
    if (error.status === 403) return '当前账号没有管理后台访问权限。'
    if (error.status === 429) return '登录尝试过多，请稍后重试。'
    if (error.status === 409) return '此设备的登录会话过多，请退出已有会话后重试。'
  }
  return '暂时无法登录，请检查网络后重试。'
}

export function LoginPage() {
  const { state, login } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const originalTitle = document.title
    document.title = '管理员登录 · 专注时光'
    return () => { document.title = originalTitle }
  }, [])

  if (state.status === 'authenticated') return <Navigate to="/" replace />

  const message = error || (!submitted && state.status === 'anonymous' ? state.notice : '') ||
    (!submitted && state.status === 'unavailable' ? '暂时无法连接管理服务，请稍后重试。' : '')
  const checking = state.status === 'checking'
  const successNotice = !error && !submitted && state.status === 'anonymous' && state.noticeTone === 'success'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || checking) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    setSubmitted(true)
    try {
      await login(String(data.get('email')).trim(), String(data.get('password')))
    } catch (reason) {
      setError(loginError(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <div className="login-brand">
          <span className="login-brand-mark"><Clock aria-hidden="true" /></span>
          <span><strong>专注时光</strong><span>管理后台</span></span>
        </div>
        <div className="login-intro">
          <p>专注时光 · 管理后台</p>
          <span>管理用户、订单与会员，维护系统稳定运行。</span>
        </div>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-heading">
            <span className="login-lock"><LockKeyhole aria-hidden="true" /></span>
            <h1 id="login-title">管理员登录</h1>
            <p>请输入管理员账号和密码</p>
          </div>
          <form className="login-form" onSubmit={submit} aria-busy={busy || checking}>
            <label className="login-field">
              <UserRound aria-hidden="true" />
              <span className="sr-only">管理员账号</span>
              <input name="email" type="email" autoComplete="username" placeholder="管理员账号" maxLength={256} required />
            </label>
            <div className="login-field">
              <LockKeyhole aria-hidden="true" />
              <label className="sr-only" htmlFor="login-password">密码</label>
              <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                placeholder="请输入密码" maxLength={128} required />
              <button type="button" className="login-show-password" onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}>
                {showPassword ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
              </button>
            </div>
            {message && <p role={successNotice ? 'status' : 'alert'} className={successNotice ? 'login-success' : 'login-error'}>{message}</p>}
            <Button type="submit" className="login-submit" disabled={busy || checking}>
              {checking ? '正在验证…' : busy ? '正在登录…' : '登录'}
            </Button>
          </form>
          <div className="login-divider" />
          <div className="login-security">
            <ShieldCheck aria-hidden="true" />
            <div><strong>安全提示</strong><p>仅限授权的管理员使用，请妥善保管账号和密码。</p></div>
          </div>
        </section>
      </div>
    </main>
  )
}
