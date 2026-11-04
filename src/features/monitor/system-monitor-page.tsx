import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { initialMonitor, monitorOverview, refreshMonitor, type Incident } from './monitor-data'
import { MonitorDetail, type MonitorSelection } from './monitor-detail'
import { MonitorAlerts, MonitorIncidents } from './monitor-incidents'
import { MonitorServices, MonitorStatus } from './monitor-services'
import { MonitorHeaderActions, MonitorOverview, MonitorQuickActions } from './monitor-summary'
import './monitor.css'

export function SystemMonitorPage() {
  const [snapshot, setSnapshot] = useState(() => initialMonitor(Date.now()))
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState('')
  const [selection, setSelection] = useState<MonitorSelection | null>(null)
  const refreshTimer = useRef<number | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  const data = monitorOverview(snapshot)

  useEffect(() => () => {
    if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  function refresh() {
    if (refreshTimer.current !== null) return
    setRefreshing(true)
    setNotice('')
    refreshTimer.current = window.setTimeout(() => {
      const checkedAt = Date.now()
      setSnapshot((current) => refreshMonitor(current, checkedAt))
      refreshTimer.current = null
      setRefreshing(false)
      setNotice('状态刷新完成')
    }, 650)
  }

  function openDetail(next: MonitorSelection, trigger: HTMLButtonElement) {
    detailTrigger.current = trigger
    setSelection(next)
  }

  function openIncident(incident: Incident, trigger: HTMLButtonElement) {
    openDetail({ kind: 'incident', incident }, trigger)
  }

  return (
    <>
      <PageHeader title="系统监控" description="查看云端服务运行状态及异常情况，及时发现并处理影响用户使用的问题。"
        actions={<MonitorHeaderActions checkedAt={snapshot.checkedAt} refreshing={refreshing} onRefresh={refresh} />} />
      <div className="system-monitor monitor-layout">
        <div className="monitor-main">
          <MonitorStatus status={data.status} />
          <MonitorServices checks={snapshot.checks} onDetails={(check, trigger) => openDetail({ kind: 'service', check, checkedAt: snapshot.checkedAt }, trigger)} />
          <MonitorIncidents incidents={data.recent} onDetails={openIncident} />
        </div>
        <aside className="monitor-side" aria-label="监控摘要和快捷操作">
          <MonitorOverview data={data} />
          <MonitorAlerts incidents={data.active} onDetails={openIncident} />
          <MonitorQuickActions refreshing={refreshing} onRefresh={refresh} onLogs={() => setNotice('系统日志入口暂未开放')} />
        </aside>
      </div>
      <div role="status" className={notice ? 'monitor-notice' : 'sr-only'}>{notice}</div>
      {selection && <MonitorDetail selection={selection} onClose={() => setSelection(null)} restoreFocus={() => detailTrigger.current?.focus()} />}
    </>
  )
}
