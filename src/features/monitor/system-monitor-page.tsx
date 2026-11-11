import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { coreChecks, overallStatus, recentIncidents, type Incident, type MonitorSnapshot } from './monitor-data'
import { MonitorDetail } from './monitor-detail'
import { MonitorIncidents } from './monitor-incidents'
import { MonitorServices, MonitorStatus } from './monitor-services'
import { MonitorHeaderActions } from './monitor-summary'
import './monitor.css'

export function SystemMonitorPage() {
  const { request } = useAdminAuth()
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const [failed, setFailed] = useState(false)
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [selection, setSelection] = useState<Incident | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const manualRefresh = useRef(false)

  useEffect(() => {
    let disposed = false
    let busy = false
    let active: AbortController | undefined
    async function load() {
      if (busy) return
      busy = true
      active = new AbortController()
      const timeout = window.setTimeout(() => active?.abort(), 12000)
      setRefreshing(true)
      setNotice('')
      const started = performance.now()
      try {
        const result = await request<MonitorSnapshot>('/api/v1/admin/monitor', { signal: active.signal })
        if (disposed) return
        if (!Number.isFinite(result?.checkedAt) || !Array.isArray(result.checks) || !Array.isArray(result.incidents))
          throw new Error('Invalid monitoring snapshot')
        const latency = Math.round(performance.now() - started)
        const checks = coreChecks(result.checks).map(check =>
          check.id === 'api' && check.status !== 'unknown' ? { ...check, latencyMs: latency } : check)
        setSnapshot({ ...result, checks, incidents: recentIncidents(result) })
        setFailed(false)
        if (manualRefresh.current) setNotice('状态刷新完成')
      } catch {
        if (!disposed) setFailed(true)
      } finally {
        window.clearTimeout(timeout)
        busy = false
        if (!disposed) {
          manualRefresh.current = false
          setRefreshing(false)
        }
      }
    }
    void load()
    const poll = window.setInterval(() => { if (!document.hidden) void load() }, 30000)
    return () => {
      disposed = true
      active?.abort()
      window.clearInterval(poll)
    }
  }, [request, attempt])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const checks = failed || !snapshot ? coreChecks() : snapshot.checks
  const status = overallStatus(checks)
  const selected = selection && (snapshot?.incidents.find(incident => incident.id === selection.id) ?? selection)

  function openIncident(incident: Incident, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger
    setSelection(incident)
  }

  return <>
    <PageHeader title="系统监控" description="监控核心服务的运行状态，及时发现并处理异常。"
      actions={<MonitorHeaderActions checkedAt={snapshot?.checkedAt} refreshing={refreshing} onRefresh={() => { manualRefresh.current = true; setAttempt(value => value + 1) }} />} />
    <div className="system-monitor monitor-layout">
      <MonitorStatus checks={checks} loading={!snapshot && refreshing} failed={failed} />
      <MonitorServices checks={checks} loading={!snapshot && refreshing} />
      <MonitorIncidents incidents={snapshot?.incidents ?? []} onDetails={openIncident}
        healthy={status === 'healthy'} loading={!snapshot && refreshing} stale={failed} />
    </div>
    <div role="status" className={notice ? 'monitor-notice' : 'sr-only'}>{notice}</div>
    {selected && <MonitorDetail incident={selected} checkedAt={snapshot?.checkedAt ?? selected.occurredAt}
      stale={failed} onClose={() => setSelection(null)} restoreFocus={() => detailTrigger.current?.focus()} />}
  </>
}
