import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { X } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { useAdminAuth } from '@/features/auth/admin-auth'
import type { User, UserStatsData } from './user-types'
import { toUser, usersPath, type UsersPage } from './user-api'
import { UserDialog } from './user-dialog'
import { UserActionConfirmation } from './user-action-confirmation'
import { UserFilters } from './user-filters'
import { defaultUserFilters, quickFilterLabels, type UserFilterValues } from './user-list-model'
import { UserStats } from './user-stats'
import { UserTable, type UserAction } from './user-table'
import './users.css'

export function UserManagementPage() {
  const { request } = useAdminAuth()
  const [params, setParams] = useSearchParams()
  const linkedId = params.get('userId')
  const [filters, setFilters] = useState(defaultUserFilters)
  const [requestedPage, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selection, setSelection] = useState<User | null>(null)
  const [confirmation, setConfirmation] = useState<{ user: User; action: 'disable' | 'restore' } | null>(null)
  const [result, setResult] = useState<{ path: string; data: UsersPage } | null>(null)
  const [stats, setStats] = useState<UserStatsData | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const dialogTrigger = useRef<HTMLButtonElement>(null)
  const effectiveFilters = linkedId ? { ...defaultUserFilters, query: linkedId } : filters
  const path = usersPath(effectiveFilters, requestedPage, pageSize)
  const data = result?.path === path ? result.data : undefined
  const detailId = selection?.id ?? linkedId
  const linkedUser = data?.items.find(user => user.id === linkedId)
  const selectedUser = selection ?? (linkedUser ? toUser(linkedUser) : null)

  useEffect(() => {
    const controller = new AbortController()
    setFailure('')
    request<UsersPage>(path, { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return
      setResult({ path, data }); setStats(data.stats); setStatusNote(data.accountStatusNote)
    }).catch(() => {
      if (controller.signal.aborted) return
      setResult(null); setFailure('用户数据获取失败，请检查后端服务后重试。')
    })
    return () => controller.abort()
  }, [path, request, reload])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  function clearLinkedUser() {
    if (!linkedId) return
    const next = new URLSearchParams(params); next.delete('userId'); setParams(next, { replace: true })
  }
  function changeFilters(next: UserFilterValues) {
    clearLinkedUser(); setFilters(next); setPage(1)
  }
  function closeDetails() {
    setSelection(null)
    if (linkedId) setFilters({ ...defaultUserFilters, query: linkedId })
    clearLinkedUser()
  }
  async function copyUserId(user: User) {
    try {
      await navigator.clipboard.writeText(user.id)
      setNotice(`已复制用户ID：${user.id}`)
      return true
    } catch {
      setNotice('复制失败，请重试或从用户ID处手动复制。')
      return false
    }
  }
  function openUserAction(user: User, action: UserAction, trigger: HTMLButtonElement) {
    dialogTrigger.current = trigger
    if (action === 'details') setSelection(user)
    else setConfirmation({ user, action })
  }
  function restoreFocus() {
    if (dialogTrigger.current?.isConnected) dialogTrigger.current.focus()
    else searchRef.current?.focus()
  }
  return <>
    <PageHeader title="用户管理" description="管理注册用户、账号状态及会员信息。" />
    <div className="user-management">
      <UserStats data={stats} statusNote={statusNote} selected={effectiveFilters.quick}
        onSelect={quick => changeFilters({ ...effectiveFilters, quick })} />
      <Card className="user-list-card" aria-label="注册用户列表">
        <UserFilters values={effectiveFilters} onChange={changeFilters} searchRef={searchRef} />
        {effectiveFilters.quick !== 'all' && <div className="user-quick-filters" aria-label="卡片快捷筛选">
          <button type="button" onClick={() => changeFilters({ ...effectiveFilters, quick: 'all' })}
            aria-label={`取消${quickFilterLabels[effectiveFilters.quick]}筛选`}>
            {quickFilterLabels[effectiveFilters.quick]}<X size={14} aria-hidden="true" />
          </button>
        </div>}
        {failure ? <div className="user-request-state" role="alert"><p>{failure}</p><Button variant="ghost" onClick={() => setReload(value => value + 1)}>重试</Button></div>
          : !data ? <div className="user-request-state" role="status">正在加载用户数据…</div> : <>
            <UserTable users={data.items.map(toUser)} onAction={openUserAction} onClearFilters={() => changeFilters(defaultUserFilters)}
              emptyMessage={data.stats.total === 0 ? '暂无注册用户' : '没有找到匹配的用户'} />
            <ListPagination total={data.total} page={data.page} pageCount={Math.ceil(data.total / pageSize)} pageSize={pageSize}
              countLabel="条数据" navigationLabel="用户列表分页" onPageChange={setPage}
              onPageSizeChange={size => { setPageSize(size); setPage(1) }} />
          </>}
      </Card>
    </div>
    <UserDialog key={detailId ?? 'closed'} open={!!detailId} userId={detailId} user={selectedUser}
      onClose={closeDetails} restoreFocus={restoreFocus} onCopy={copyUserId}
      onMembershipChanged={() => { setReload(value => value + 1); setNotice('会员调整成功，用户权益及操作日志已更新。') }} />
    {confirmation && <UserActionConfirmation user={confirmation.user} action={confirmation.action}
      restoreFocus={restoreFocus} onClose={() => setConfirmation(null)} onSuccess={() => {
        setNotice(confirmation.action === 'disable' ? '账号已禁用。' : '账号已恢复。')
        setConfirmation(null)
        setReload(value => value + 1)
      }} />}
    <div className="user-action-notice" role="status" aria-live="polite" aria-atomic="true">{notice && <span>{notice}</span>}</div>
  </>
}
