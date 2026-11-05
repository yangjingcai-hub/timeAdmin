import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, KeyRound, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ChangePasswordDialog } from '@/features/auth/change-password-dialog'
import './admin-account-menu.css'

function AdminAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={className} aria-hidden="true">
      <AvatarImage src="/admin-avatar.svg" alt="" />
      <AvatarFallback>管</AvatarFallback>
    </Avatar>
  )
}

export function AdminAccountMenu() {
  const { state, logout } = useAdminAuth()
  const [notice, setNotice] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const openingDialog = useRef(false)

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  async function handleLogout() {
    setSigningOut(true)
    try {
      await logout()
    } catch {
      setNotice('退出登录失败，请稍后重试。')
      setSigningOut(false)
    }
  }

  return (
    <>
      <DropdownMenu.Root modal={false} onOpenChange={(open) => { if (open) setNotice('') }}>
        <DropdownMenu.Trigger asChild>
          <Button ref={trigger} type="button" variant="ghost" className="admin-menu-trigger" aria-label="管理员账号菜单">
            <AdminAvatar className="size-11" />
            <span className="admin-menu-name">管理员</span>
            <ChevronDown className="admin-menu-chevron" size={15} aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content side="bottom" align="end" sideOffset={10} collisionPadding={12} className="admin-account-menu"
            onCloseAutoFocus={event => { if (openingDialog.current) event.preventDefault(); openingDialog.current = false }}>
            <DropdownMenu.Label className="admin-menu-identity">
              <AdminAvatar className="size-12" />
              <span><strong>管理员</strong><span>{state.status === 'authenticated' ? state.session.email : ''}</span></span>
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="admin-menu-separator" />
            <DropdownMenu.Item className="admin-menu-item" onSelect={() => { openingDialog.current = true; setChangingPassword(true) }}>
              <KeyRound size={18} aria-hidden="true" />修改密码
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="admin-menu-separator" />
            <DropdownMenu.Item className="admin-menu-item admin-menu-logout" disabled={signingOut} onSelect={handleLogout}>
              <LogOut size={18} aria-hidden="true" />退出登录
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div role="status" className={notice ? 'admin-menu-notice' : 'sr-only'}>{notice}</div>
      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} restoreFocus={() => trigger.current?.focus()} />}
    </>
  )
}
