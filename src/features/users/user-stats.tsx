import { Crown, Info, UserRoundPlus, UserRoundX, UsersRound } from 'lucide-react'
import { formatUserCount } from './user-display'
import type { UserQuickFilter, UserStatsData } from './user-types'

const metrics = [
  { key: 'total', quick: 'all', label: '全部用户', caption: '累计注册账号', icon: UsersRound, tone: 'orange' },
  { key: 'members', quick: 'members', label: '有效会员', caption: '当前拥有会员权限', icon: Crown, tone: 'green' },
  { key: 'today', quick: 'today', label: '今日新增', caption: '今日注册用户', icon: UserRoundPlus, tone: 'purple' },
  { key: 'inactive', quick: 'inactive', label: '已停用账号', caption: '包含已禁用与已注销账号', icon: UserRoundX, tone: 'gray' },
] as const
export function UserStats({ data, selected, onSelect, statusNote }: {
  data: UserStatsData | null; selected: UserQuickFilter; onSelect: (value: UserQuickFilter) => void; statusNote: string
}) {
  return <section className="stat-grid user-stats" aria-label="用户统计">
    {metrics.map(({ key, quick, label, caption, icon: Icon, tone }) => <button key={key} type="button"
      className={`stat-card stat-${tone}`} aria-label={label} aria-pressed={selected === quick} onClick={() => onSelect(quick)}>
      <span className="stat-icon"><Icon size={27} strokeWidth={2.25} aria-hidden="true" fill={tone === 'green' ? 'currentColor' : 'none'} /></span>
      <span className="stat-copy"><span className="user-stat-label">{label}</span>
        <span className="stat-value">{data ? formatUserCount(data[key]) : '—'}</span>
        <span className="stat-caption">{caption}</span></span>
      {key === 'inactive' && statusNote && <span className="user-status-info" title={statusNote} aria-label={statusNote}><Info size={16} aria-hidden="true" /></span>}
    </button>)}
  </section>
}
