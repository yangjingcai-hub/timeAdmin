import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { monitorOverview, unknownChecks, type Incident, type MonitorSnapshot } from './monitor-data'
import { MonitorDetail } from './monitor-detail'
import { MonitorAlerts, MonitorIncidents } from './monitor-incidents'
import { MonitorServices, MonitorStatus } from './monitor-services'
import { MonitorHeaderActions } from './monitor-summary'
import './monitor.css'

export function SystemMonitorPage() {
  const { request } = useAdminAuth()
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const [failure, setFailure] = useState('')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [selection, setSelection] = useState<Incident | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null)

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
        const latency = Math.round(performance.now() - started)
        setSnapshot({ ...result, checks: result.checks.map(check =>
          check.id === 'api' && check.metricLabel === '本次响应' ? { ...check, latencyMs: latency } : check) })
        setFailure('')
        setNotice('状态刷新完成')
      } catch {
        if (!disposed) setFailure('监控数据获取失败，当前服务状态未知。已获取的异常记录保留至最近一次成功检查。')
      } finally {
        window.clearTimeout(timeout)
        busy = false
        if (!disposed) setRefreshing(false)
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

  const checks = failure || !snapshot ? unknownChecks() : snapshot.checks
  const overview = snapshot ? monitorOverview(snapshot) : null
  const selected = selection && (snapshot?.incidents.find(incident => incident.id === selection.id) ?? selection)
  const unknown = !!failure || !snapshot || checks.some(check => check.status === 'unknown')

  function openIncident(incident: Incident, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger
    setSelection(incident)
  }

  return <>
    <PageHeader title="系统监控" description="查看核心服务状态与异常情况，及时发现并处理影响用户使用的问题。"
      actions={<MonitorHeaderActions checkedAt={snapshot?.checkedAt} refreshing={refreshing} onRefresh={() => setAttempt(value => value + 1)} />} />
    <div className="system-monitor monitor-layout">
      <MonitorStatus checks={checks} loading={!snapshot && refreshing} failed={!!failure} />
      {failure && <p role="alert" className="monitor-failure">{failure}</p>}
      <MonitorServices checks={checks} loading={!snapshot && refreshing} />
      <MonitorIncidents incidents={overview?.recent ?? []} onDetails={openIncident}
        message={failure ? '异常记录暂时无法获取' : !snapshot ? '正在获取异常记录…' : undefined}
        historyStartedAt={snapshot?.historyStartedAt} />
      <MonitorAlerts incidents={overview?.active ?? []} onDetails={openIncident} unknown={unknown} />
    </div>
    <div role="status" className={notice ? 'monitor-notice' : 'sr-only'}>{notice}</div>
    {selected && <MonitorDetail incident={selected} checkedAt={snapshot?.checkedAt ?? selected.occurredAt}
      stale={!!failure} onClose={() => setSelection(null)} restoreFocus={() => detailTrigger.current?.focus()} />}
  </>
}
