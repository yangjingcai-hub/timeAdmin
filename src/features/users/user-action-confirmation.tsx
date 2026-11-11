import { useRef, useState } from 'react'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import { detailPath } from './user-detail-api'
import { UserDetailSubdialog } from './user-detail-components'
import type { User } from './user-types'
import './user-detail-pages.css'

const actions = {
  disable: { title: '禁用账号', confirm: '确认禁用', path: 'disable', effect: '禁用后，该用户的所有设备将退出登录，账号恢复后才能重新登录。' },
  restore: { title: '恢复账号', confirm: '确认恢复', path: 'restore', effect: '恢复后，该用户可以重新登录。' },
  'sign-out': { title: '强制退出所有设备', confirm: '确认退出', path: 'sessions/revoke-all', effect: '所有设备的登录会话将失效，用户需重新登录。' },
} as const

const errors: Record<string, string> = {
  administrator_protected: '管理员账号受保护，无法在此禁用。',
  user_closed: '该账号已注销，无法执行此操作。',
  account_changed: '账号信息已变更，请关闭弹窗并刷新后重试。',
  user_not_found: '未找到该账号，请刷新后重试。',
}

export function UserActionConfirmation({ user, action, onClose, onSuccess, restoreFocus }: {
  user: Pick<User, 'id' | 'email'>
  action: keyof typeof actions
  onClose: () => void
  onSuccess: () => void
  restoreFocus?: () => void
}) {
  const { request } = useAdminAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  const operationId = useRef<string | null>(null)
  const { title, confirm, path, effect } = actions[action]

  async function submit() {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    operationId.current ??= crypto.randomUUID()
    try {
      const result = await request<{ userId: string }>(detailPath(user.id, path), {
        method: 'POST', headers: { 'X-FocusTime-Admin': '1' }, body: JSON.stringify({ operationId: operationId.current }),
      })
      if (result.userId.toLowerCase() !== user.id.toLowerCase()) throw new Error('Unexpected user action response')
      onSuccess()
    } catch (failure) {
      setError((failure instanceof ApiError && errors[failure.code ?? '']) || '暂未确认操作结果，请重试。')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <UserDetailSubdialog title={title} description={`${user.email}。${effect}`} confirmation busy={busy}
    confirmLabel={confirm} primary={action === 'restore'} restoreFocus={restoreFocus}
    onClose={() => { if (!submitting.current) onClose() }} onConfirm={() => void submit()}>
    {error && <p className="user-action-error" role="alert">{error}</p>}
  </UserDetailSubdialog>
}
