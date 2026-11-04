import { useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { ListPagination } from '@/components/ui/list-controls'
import type { AccountStatus, User } from './mock-users'
import { UserDialog, type UserDialogState } from './user-dialog'
import { UserFilters } from './user-filters'
import { defaultUserFilters, filterUsers, getUserStats, useMockAccounts, type UserFilterValues } from './user-list-model'
import { UserStats } from './user-stats'
import { UserTable, type UserAction } from './user-table'
import './users.css'

export function UserManagementPage() {
  const { users, updateAccount } = useMockAccounts()
  const [filters, setFilters] = useState(defaultUserFilters)
  const [requestedPage, setRequestedPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selection, setSelection] = useState<UserDialogState | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const dialogTrigger = useRef<HTMLButtonElement>(null)

  const stats = useMemo(() => getUserStats(users), [users])
  const filteredUsers = useMemo(() => filterUsers(users, filters), [users, filters])
  const pageCount = Math.ceil(filteredUsers.length / pageSize)
  const page = Math.min(requestedPage, Math.max(pageCount, 1))
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  function changeFilters(next: UserFilterValues) {
    setFilters(next)
    setRequestedPage(1)
  }

  function openUserAction(user: User, action: UserAction, trigger: HTMLButtonElement) {
    dialogTrigger.current = trigger
    setSelection({ user, action })
  }

  function confirmAccountChange(user: User, status: AccountStatus) {
    updateAccount(user, status)
    setSelection(null)
  }

  function restoreFocus() {
    if (dialogTrigger.current?.isConnected) dialogTrigger.current.focus()
    else searchRef.current?.focus()
  }

  return (
    <>
      <PageHeader title="用户管理" description="管理注册用户、账号状态及会员信息。" />
      <div className="user-management">
        <UserStats data={stats} />
        <Card className="user-list-card" aria-label="注册用户列表">
          <UserFilters values={filters} onChange={changeFilters} searchRef={searchRef} />
          <UserTable users={visibleUsers} onAction={openUserAction} onClearFilters={() => changeFilters(defaultUserFilters)} />
          <ListPagination total={filteredUsers.length} page={page} pageCount={pageCount} pageSize={pageSize} countLabel="条数据" navigationLabel="用户列表分页"
            onPageChange={setRequestedPage} onPageSizeChange={(size) => { setPageSize(size); setRequestedPage(1) }} />
        </Card>
      </div>
      <UserDialog selection={selection} onClose={() => setSelection(null)} onConfirm={confirmAccountChange} restoreFocus={restoreFocus} />
    </>
  )
}
