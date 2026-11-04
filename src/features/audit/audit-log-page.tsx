import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { ListPagination } from '@/components/ui/list-controls'
import { defaultAuditFilters, filterAuditLogs, mockAuditLogs, presetAuditRange, type AuditDateRange, type AuditFilters as FilterValues, type AuditLog, type AuditPeriod } from './audit-data'
import { AuditDetail } from './audit-detail'
import { AuditFilters } from './audit-filters'
import { AuditTable } from './audit-table'
import './audit.css'

const dockQuery = '(min-width: 1360px)'

function subscribeToWidth(listener: () => void) {
  const query = window.matchMedia(dockQuery)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

function isDocked() {
  return window.matchMedia(dockQuery).matches
}

export function AuditLogPage() {
  const [filters, setFilters] = useState(defaultAuditFilters)
  const [period, setPeriod] = useState<AuditPeriod>('week')
  const [dates, setDates] = useState(() => presetAuditRange('week'))
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const docked = useSyncExternalStore(subscribeToWidth, isDocked)

  const matching = useMemo(() => filterAuditLogs(mockAuditLogs, filters, dates), [filters, dates])
  const pageCount = Math.ceil(matching.length / pageSize)
  const logs = matching.slice((page - 1) * pageSize, page * pageSize)

  function changeFilters(next: FilterValues) {
    setFilters(next)
    setPage(1)
  }

  function changeDates(next: AuditDateRange) {
    setDates(next)
    setPage(1)
  }

  function changePeriod(next: AuditPeriod) {
    setPeriod(next)
    if (next !== 'custom') changeDates(presetAuditRange(next))
  }

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  function openDetail(log: AuditLog, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger
    setSelected(log)
  }

  function restoreFocus() {
    if (detailTrigger.current?.isConnected) detailTrigger.current.focus()
    else searchRef.current?.focus()
  }

  return (
    <>
      <PageHeader title="操作日志" description="记录管理后台的重要操作，便于追溯操作来源、变更内容和执行结果。" />
      <section className="audit-list" aria-label="后台操作记录" data-docked={docked} data-detail-open={selected !== null}>
        <AuditFilters values={filters} onChange={changeFilters} searchRef={searchRef} period={period} onPeriodChange={changePeriod} dates={dates} onDatesChange={changeDates} />
        <AuditTable logs={logs} selectedId={selected?.id} onDetails={openDetail} onClear={() => { changeFilters(defaultAuditFilters); changePeriod('week') }} />
        <ListPagination total={matching.length} page={page} pageCount={pageCount} pageSize={pageSize} countLabel="条记录" navigationLabel="操作日志分页"
          onPageChange={setPage} onPageSizeChange={changePageSize} />
      </section>
      {selected && <AuditDetail log={selected} docked={docked} onClose={() => setSelected(null)} restoreFocus={restoreFocus} />}
    </>
  )
}
