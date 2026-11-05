import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCheckTime } from './monitor-data'

export function MonitorHeaderActions({ checkedAt, refreshing, onRefresh }: {
  checkedAt?: number; refreshing: boolean; onRefresh: () => void
}) {
  return (
    <div className="monitor-header-actions">
      <Button type="button" variant="ghost" className="monitor-refresh-button" disabled={refreshing}
        aria-busy={refreshing} onClick={onRefresh}>
        <RefreshCw size={17} data-spinning={refreshing} aria-hidden="true" />{refreshing ? '刷新中…' : '刷新状态'}
      </Button>
      <span className="monitor-last-check">最近检查：{checkedAt
        ? <time dateTime={new Date(checkedAt).toISOString()}>{formatCheckTime(checkedAt)}</time> : '—'}</span>
    </div>
  )
}
