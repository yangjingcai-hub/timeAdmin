import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ListPagination } from '@/components/ui/list-controls'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { auditPath, toAuditLog, type AdminAuditResponse, type AuditPage } from './audit-api'
import { defaultAuditFilters, presetAuditRange, type AuditDateRange, type AuditFilters as FilterValues, type AuditLog, type AuditPeriod } from './audit-data'
import { AuditDetail } from './audit-detail'
import { AuditFilters } from './audit-filters'
import { AuditTable } from './audit-table'
import './audit.css'

export function AuditLogPage() {
  const { request } = useAdminAuth()
  const [params, setParams] = useSearchParams()
  const linkedId = params.get('logId')
  const [filters, setFilters] = useState(defaultAuditFilters)
  const [period, setPeriod] = useState<AuditPeriod>('week')
  const [dates, setDates] = useState(() => presetAuditRange('week'))
  const [requestedPage, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [result, setResult] = useState<{ path: string; data: AuditPage } | null>(null)
  const [failure, setFailure] = useState('')
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)
  const [detail, setDetail] = useState<AuditLog | null>(null)
  const [detailFailure, setDetailFailure] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailAttempt, setDetailAttempt] = useState(0)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const path = auditPath(filters, dates, requestedPage, pageSize)
  const data = result?.path === path ? result.data : undefined
  const logs = data?.items.map(toAuditLog) ?? []
  const page = data?.page ?? requestedPage
  const pageCount = Math.ceil((data?.total ?? 0) / pageSize)
  const selectedId = selected?.id ?? linkedId
  const selectedLog = detail?.id === selectedId ? detail : selected

  useEffect(() => {
    const controller = new AbortController()
    setFailure(''); setLoading(true)
    request<AuditPage>(path, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setResult({ path, data: value })
    }).catch(() => { if (!controller.signal.aborted) setFailure('操作日志读取失败，请检查后台服务后重试。') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [path, request, reload])

  useEffect(() => {
    if (selectedId) return
    const refresh = () => {
      if (document.hidden) return
      if (period !== 'custom') setDates(presetAuditRange(period))
      setReload(value => value + 1)
    }
    const timer = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [period, selectedId])

  useEffect(() => {
    if (!selectedId) return
    const controller = new AbortController()
    setDetailLoading(true); setDetailFailure('')
    request<AdminAuditResponse>(`/api/v1/admin/audit-logs/${encodeURIComponent(selectedId)}`, { signal: controller.signal }).then(value => {
      if (value.id !== selectedId) throw new Error('Unexpected audit identity')
      if (!controller.signal.aborted) setDetail(toAuditLog(value))
    }).catch(() => { if (!controller.signal.aborted) setDetailFailure('操作详情读取失败，请重试。') })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false) })
    return () => controller.abort()
  }, [selectedId, request, detailAttempt])

  function changeFilters(next: FilterValues) { setFilters(next); setPage(1) }
  function changeDates(next: AuditDateRange) { setDates(next); setPage(1) }
  function changePeriod(next: AuditPeriod) { setPeriod(next); if (next !== 'custom') changeDates(presetAuditRange(next)) }
  function openDetail(log: AuditLog, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger; setDetail(null); setDetailLoading(true); setDetailFailure(''); setSelected(log)
  }
  function restoreFocus() {
    const trigger = detailTrigger.current
    if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    else searchRef.current?.focus({ preventScroll: true })
  }
  function closeDetail() {
    setSelected(null)
    if (!linkedId) return
    const next = new URLSearchParams(params)
    next.delete('logId')
    setParams(next, { replace: true })
  }
  return <>
    <PageHeader title="操作日志" description="记录管理后台的重要操作，便于追溯操作来源、变更内容和执行结果。" />
    <section className="audit-list" aria-label="后台操作记录" aria-busy={loading}>
      {linkedId && !selectedLog && <div className="audit-live-feedback" role={detailFailure ? 'alert' : 'status'}>
        <span>{detailFailure || '正在读取操作详情…'}</span>
        {detailFailure && <Button variant="ghost" onClick={() => setDetailAttempt(value => value + 1)}>重试</Button>}
        <Button variant="ghost" onClick={closeDetail}>关闭</Button>
      </div>}
      <AuditFilters values={filters} onChange={changeFilters} searchRef={searchRef} period={period} onPeriodChange={changePeriod} dates={dates} onDatesChange={changeDates} />
      <div className="audit-live-feedback" role={failure ? 'alert' : 'status'}><span>{failure || (loading && !data ? '正在读取操作日志…' : '每 15 秒自动刷新，展示已保存的真实管理操作')}</span>
        <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={14} aria-hidden="true" />{loading ? '刷新中…' : '刷新日志'}</Button></div>
      {data && <AuditTable logs={logs} selectedId={selectedId ?? undefined} onDetails={openDetail} onClear={() => { changeFilters(defaultAuditFilters); changePeriod('week') }} />}
      <ListPagination total={data?.total ?? 0} page={page} pageCount={pageCount} pageSize={pageSize} countLabel="条记录" navigationLabel="操作日志分页"
        onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1) }} />
    </section>
    {selectedLog && <AuditDetail key={selectedLog.id} log={selectedLog}
      loading={detailLoading} error={detailFailure} onRetry={() => setDetailAttempt(value => value + 1)}
      onClose={closeDetail} restoreFocus={restoreFocus} />}
  </>
}
