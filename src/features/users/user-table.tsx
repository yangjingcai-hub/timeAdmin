import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Ban, Crown, Ellipsis } from 'lucide-react'
import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListEmpty } from '@/components/ui/list-controls'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AccountStatus, User } from './user-types'
import { accountLabels, membershipExpiry, membershipPlan } from './user-display'

export type UserAction = 'details' | 'membership'

interface UserTableProps {
  users: User[]
  onAction: (user: User, action: UserAction, trigger: HTMLButtonElement) => void
  onClearFilters: () => void
  emptyMessage?: string
}

export function AccountBadge({ status }: { status: AccountStatus }) {
  return <Badge className={`user-badge user-account-${status}`}>{accountLabels[status]}</Badge>
}

function UserRowActions({ user, onAction }: Pick<UserTableProps, 'onAction'> & { user: User }) {
  const menuTrigger = useRef<HTMLButtonElement>(null)
  const opensDialog = useRef(false)

  function selectAction(action: UserAction) {
    if (!menuTrigger.current) return
    opensDialog.current = true
    onAction(user, action, menuTrigger.current)
  }

  return (
    <div className="user-row-actions">
      <Button type="button" variant="ghost" size="sm" className="user-detail-button" aria-label={`详情 ${user.id}`}
        onClick={(event) => onAction(user, 'details', event.currentTarget)}>详情</Button>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <Button ref={menuTrigger} type="button" variant="ghost" size="icon" className="user-more-button" aria-label={`更多操作 ${user.id}`}>
            <Ellipsis size={18} aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="user-action-menu" align="end" sideOffset={5}
            onCloseAutoFocus={(event) => {
              if (opensDialog.current) event.preventDefault()
              opensDialog.current = false
            }}>
            <DropdownMenu.Item className="user-menu-item" disabled title="后端尚未开放账号状态修改接口">
              <Ban size={16} aria-hidden="true" />账号状态修改暂未开放
            </DropdownMenu.Item>
            <DropdownMenu.Item className="user-menu-item" onSelect={() => selectAction('membership')}>
              <Crown size={16} aria-hidden="true" />查看会员信息
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

export function UserTable({ users, onAction, onClearFilters, emptyMessage = '没有找到匹配的用户' }: UserTableProps) {
  return (
    <div className="list-table-frame">
      <Table className="list-data-table managed-user-table" aria-label="用户列表">
        <TableHeader>
          <TableRow>
            {['用户ID', '邮箱', '会员状态', '会员套餐', '到期时间', '注册时间', '最后登录', '账号状态', '操作'].map((label) => <TableHead key={label}>{label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="managed-user-id"><span title={user.id}>{user.id}</span></TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.membership
                  ? <Badge className="user-badge user-member"><Crown size={13} aria-hidden="true" />会员</Badge>
                  : <Badge className="user-badge user-nonmember">非会员</Badge>}
              </TableCell>
              <TableCell>{membershipPlan(user.membership)}</TableCell>
              <TableCell>{membershipExpiry(user.membership)}</TableCell>
              <TableCell>{user.registeredAt}</TableCell>
              <TableCell>{user.lastLoginAt ?? '—'}</TableCell>
              <TableCell><AccountBadge status={user.status} /></TableCell>
              <TableCell><UserRowActions user={user} onAction={onAction} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {users.length === 0 && <ListEmpty message={emptyMessage} onClear={onClearFilters} />}
    </div>
  )
}
