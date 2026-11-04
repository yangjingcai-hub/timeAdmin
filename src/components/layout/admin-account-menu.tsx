import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, KeyRound, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import './admin-account-menu.css'

const demoAdministrator = { name: '管理员', email: 'admin@focustime.app', avatar: '/admin-avatar.svg' }

const accountActions = [
  { label: '个人设置', icon: UserRound },
  { label: '修改密码', icon: KeyRound },
  { label: '登录安全', icon: ShieldCheck },
]

function AdminAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={className} aria-hidden="true">
      <AvatarImage src={demoAdministrator.avatar} alt="" />
      <AvatarFallback>管</AvatarFallback>
    </Avatar>
  )
}

export function AdminAccountMenu() {
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  return (
    <>
      <DropdownMenu.Root modal={false} onOpenChange={(open) => { if (open) setNotice('') }}>
        <DropdownMenu.Trigger asChild>
          <Button type="button" variant="ghost" className="admin-menu-trigger" aria-label="管理员账号菜单">
            <AdminAvatar className="size-11" />
            <span className="admin-menu-name">{demoAdministrator.name}</span>
            <ChevronDown className="admin-menu-chevron" size={15} aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content side="bottom" align="end" sideOffset={10} collisionPadding={12} className="admin-account-menu">
            <DropdownMenu.Label className="admin-menu-identity">
              <AdminAvatar className="size-12" />
              <span><strong>{demoAdministrator.name}</strong><span>{demoAdministrator.email}</span></span>
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="admin-menu-separator" />
            {accountActions.map(({ label, icon: Icon }) => (
              <DropdownMenu.Item key={label} className="admin-menu-item" onSelect={() => setNotice(`${label}功能暂未开放。`)}>
                <Icon size={18} aria-hidden="true" />{label}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="admin-menu-separator" />
            <DropdownMenu.Item className="admin-menu-item admin-menu-logout" onSelect={() => setNotice('当前为演示模式，暂无登录会话可退出。')}>
              <LogOut size={18} aria-hidden="true" />退出登录
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div role="status" className={notice ? 'admin-menu-notice' : 'sr-only'}>{notice}</div>
    </>
  )
}
