import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { X } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import type { User, UserStatsData } from './user-types'
import { toUser, usersPath, type AdminUserResponse, type UsersPage } from './user-api'
import { UserDialog } from './user-dialog'
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
  const [selection, setSelection] = useState<{ id: string; action: UserAction } | null>(null)
  const [result, setResult] = useState<{ path: string; data: UsersPage } | null>(null)
  const [stats, setStats] = useState<UserStatsData | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [failure, setFailure] = useState('')
  const [detail, setDetail] = useState<{ id: string; user: User } | null>(null)
  const [detailFailure, setDetailFailure] = useState('')
  const [reload, setReload] = useState(0)
  const [detailReload, setDetailReload] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const dialogTrigger = useRef<HTMLButtonElement>(null)
  const effectiveFilters = linkedId ? { ...defaultUserFilters, query: linkedId } : filters
  const path = usersPath(effectiveFilters, requestedPage, pageSize)
  const data = result?.path === path ? result.data : undefined
  const detailId = selection?.id ?? linkedId

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
    if (!detailId) return
    const controller = new AbortController()
    setDetail(null); setDetailFailure('')
    request<AdminUserResponse>(`/api/v1/admin/users/${encodeURIComponent(detailId)}`, { signal: controller.signal }).then(user => {
      if (!controller.signal.aborted) setDetail({ id: detailId, user: toUser(user) })
    }).catch(error => {
      if (!controller.signal.aborted) setDetailFailure(error instanceof ApiError && error.status === 404
        ? '未找到该用户，账号可能已被删除。' : '用户详情获取失败，请重试。')
    })
    return () => controller.abort()
  }, [detailId, request, detailReload])

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
  function openUserAction(user: User, action: UserAction, trigger: HTMLButtonElement) {
    dialogTrigger.current = trigger; setSelection({ id: user.id, action })
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
    <UserDialog open={!!detailId} user={detail?.id === detailId ? detail.user : null} action={selection?.action ?? 'details'}
      error={detailFailure} onClose={closeDetails} onRetry={() => setDetailReload(value => value + 1)} restoreFocus={restoreFocus} />
  </>
}
