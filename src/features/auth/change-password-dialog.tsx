import * as Dialog from '@radix-ui/react-dialog'
import { Eye, EyeOff, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAdminAuth } from './admin-auth'
import type { ChangeAdminPassword } from './admin-api'
import '@/components/ui/detail-drawer.css'
import './change-password.css'

type PasswordFieldName = keyof ChangeAdminPassword
type Errors = Partial<Record<PasswordFieldName | 'form', string>>
const emptyValues: ChangeAdminPassword = { currentPassword: '', newPassword: '', confirmPassword: '' }
const fields: { name: PasswordFieldName; label: string }[] = [
  { name: 'currentPassword', label: '当前密码' },
  { name: 'newPassword', label: '新密码' },
  { name: 'confirmPassword', label: '确认新密码' },
]

export function ChangePasswordDialog({ onClose, restoreFocus }: { onClose: () => void; restoreFocus: () => void }) {
  const { changePassword } = useAdminAuth()
  const [values, setValues] = useState(emptyValues)
  const [visible, setVisible] = useState<Partial<Record<PasswordFieldName, boolean>>>({})
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const inputs = useRef<Partial<Record<PasswordFieldName, HTMLInputElement>>>({})

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const next: Errors = {}
    for (const { name, label } of fields) if (!values[name]) next[name] = `请输入${label}。`
    if (values.newPassword && values.newPassword.length < 8) next.newPassword = '新密码不能少于 8 位。'
    if (values.newPassword && values.newPassword === values.currentPassword) next.newPassword = '新密码不能与当前密码相同。'
    if (values.confirmPassword && values.confirmPassword !== values.newPassword) next.confirmPassword = '两次输入的新密码不一致。'
    if (Object.keys(next).length) {
      setErrors(next)
      inputs.current[fields.find(field => next[field.name])!.name]?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    setErrors({})
    try {
      await changePassword(values)
      setValues(emptyValues)
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'current_password_incorrect') {
        setErrors({ currentPassword: '当前密码不正确。' })
        inputs.current.currentPassword?.focus()
      } else if (error instanceof ApiError && error.code === 'password_policy_failed') {
        setErrors({ newPassword: '新密码需为 8–128 位，并包含字母和数字。' })
      } else if (error instanceof ApiError && error.code === 'password_unchanged') {
        setErrors({ newPassword: '新密码不能与当前密码相同。' })
      } else if (error instanceof ApiError && error.code === 'validation_failed') {
        setErrors({ form: '请检查必填项、密码长度及两次新密码是否一致。' })
      } else {
        setErrors({ form: error instanceof ApiError && error.status === 429
          ? '尝试次数过多，请稍后重试。' : error instanceof ApiError
            ? '修改失败，服务暂时不可用，请稍后重试。' : '修改失败，请检查网络后重试。' })
      }
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return <Dialog.Root open onOpenChange={open => { if (!open && !submitting.current) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="detail-overlay password-dialog-overlay" />
      <Dialog.Content className="detail-surface detail-modal password-dialog"
        onOpenAutoFocus={event => { event.preventDefault(); inputs.current.currentPassword?.focus() }}
        onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
        onInteractOutside={event => { if (submitting.current) event.preventDefault() }}
        onEscapeKeyDown={event => { if (submitting.current) event.preventDefault() }}>
        <header className="password-dialog-header">
          <div><Dialog.Title>修改密码</Dialog.Title>
            <Dialog.Description>验证当前密码后修改，成功后需要重新登录。</Dialog.Description></div>
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="关闭" disabled={busy}><X size={20} aria-hidden="true" /></Button></Dialog.Close>
        </header>
        <form noValidate onSubmit={submit} aria-busy={busy}>
          <div className="password-dialog-fields">
            {fields.map(({ name, label }) => <div className="password-dialog-field" key={name}>
              <label htmlFor={`admin-${name}`}>{label}<span aria-hidden="true">*</span></label>
              <div>
                <div className="password-dialog-input">
                  <input id={`admin-${name}`} ref={input => { if (input) inputs.current[name] = input }}
                    type={visible[name] ? 'text' : 'password'} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                    value={values[name]} disabled={busy} required maxLength={128}
                    aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `password-error-${name}` : name === 'newPassword' ? 'password-rule' : undefined}
                    onChange={event => {
                      setValues(current => ({ ...current, [name]: event.target.value }))
                      setErrors(current => ({ ...current, [name]: undefined, form: undefined }))
                    }} />
                  <button type="button" disabled={busy} aria-label={`${visible[name] ? '隐藏' : '显示'}${label}`}
                    onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>
                    {visible[name] ? <Eye size={18} aria-hidden="true" /> : <EyeOff size={18} aria-hidden="true" />}
                  </button>
                </div>
                {name === 'newPassword' && <p id="password-rule" className="password-rule">密码不少于8位，建议包含字母、数字和符号。</p>}
                {errors[name] && <p role="alert" className="password-field-error" id={`password-error-${name}`}>{errors[name]}</p>}
              </div>
            </div>)}
            {errors.form && <p role="alert" className="password-field-error password-form-error">{errors.form}</p>}
          </div>
          <footer className="password-dialog-actions">
            <Dialog.Close asChild><Button type="button" variant="ghost" disabled={busy}>取消</Button></Dialog.Close>
            <Button type="submit" disabled={busy}>{busy ? '正在修改…' : '确认修改'}</Button>
          </footer>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
