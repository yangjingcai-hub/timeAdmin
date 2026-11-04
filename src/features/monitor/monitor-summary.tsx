import { CalendarDays, ChartNoAxesColumnIncreasing, CircleCheck, Clock3, FileText, RefreshCw, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCheckTime, type monitorOverview } from './monitor-data'

export function MonitorOverview({ data }: { data: ReturnType<typeof monitorOverview> }) {
  const metrics = [
    { label: '服务正常率', value: data.healthyRate, icon: CircleCheck, tone: 'green', hint: '当前检查中状态正常的服务占比' },
    { label: '平均响应时间', value: data.averageLatency, icon: Clock3, tone: 'orange', hint: '按请求量加权计算，数据库连接延迟单独统计' },
    { label: '异常次数', value: `${data.recent.length} 次`, icon: TrendingUp, tone: 'purple', hint: '最近 24 小时内发生的异常', caption: '近 24 小时' },
    { label: '无故障时长', value: data.uptime, icon: CalendarDays, tone: 'blue', hint: '距上次严重故障恢复的时长' },
  ]

  return (
    <Card className="monitor-panel monitor-overview" aria-labelledby="monitor-overview-title">
      <CardHeader><CardTitle id="monitor-overview-title" className="monitor-panel-title"><ChartNoAxesColumnIncreasing size={22} aria-hidden="true" />运行概况</CardTitle></CardHeader>
      <ul className="monitor-overview-grid">
        {metrics.map(({ label, value, icon: Icon, tone, hint, caption }) => (
          <li key={label} className={`monitor-overview-item monitor-overview-item-${tone}`} title={hint}>
            <span className={`monitor-overview-icon monitor-overview-${tone}`}><Icon size={24} aria-hidden="true" /></span>
            <div><p className="monitor-overview-label">{label}</p><p className="monitor-overview-value">{value}</p>{caption && <span className="monitor-overview-caption">{caption}</span>}</div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

interface RefreshProps {
  refreshing: boolean
  onRefresh: () => void
}

export function MonitorHeaderActions({ checkedAt, refreshing, onRefresh }: RefreshProps & { checkedAt: number }) {
  return (
    <div className="monitor-header-actions">
      <Button type="button" variant="ghost" className="monitor-refresh-button" disabled={refreshing} aria-busy={refreshing} onClick={onRefresh}>
        <RefreshCw size={17} data-spinning={refreshing} aria-hidden="true" />{refreshing ? '刷新中…' : '刷新状态'}
      </Button>
      <span className="monitor-last-check"><span className="monitor-last-check-label">最近检查：</span><time dateTime={new Date(checkedAt).toISOString()}>{formatCheckTime(checkedAt)}</time></span>
    </div>
  )
}

export function MonitorQuickActions({ refreshing, onRefresh, onLogs }: RefreshProps & { onLogs: () => void }) {
  return (
    <Card className="monitor-panel monitor-quick" aria-labelledby="monitor-quick-title">
      <CardHeader><CardTitle id="monitor-quick-title" className="monitor-panel-title"><Zap size={23} aria-hidden="true" />快捷操作</CardTitle></CardHeader>
      <div className="monitor-quick-grid">
        <Button type="button" variant="ghost" className="monitor-quick-button" disabled={refreshing} aria-busy={refreshing} onClick={onRefresh}>
          <RefreshCw size={26} data-spinning={refreshing} aria-hidden="true" />
          <strong>{refreshing ? '刷新中…' : '刷新服务状态'}</strong><span>立即检查系统健康状态</span>
        </Button>
        <Button type="button" variant="ghost" className="monitor-quick-button" onClick={onLogs}>
          <FileText size={26} aria-hidden="true" /><strong>查看系统日志</strong><span>查看运行与错误日志</span>
        </Button>
      </div>
    </Card>
  )
}
