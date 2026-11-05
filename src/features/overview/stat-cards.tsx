import { Crown, UserRoundPlus, UsersRound, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/sparkline'
import { formatNumber, formatShare, type OverviewSummary, type TrendPoint } from './overview-api'

function sparkline(values: number[]) {
  const low = Math.min(...values)
  const span = Math.max(...values) - low
  return values.map((value, index) =>
    `${index ? 'L' : 'M'}${1 + 93 * index / (values.length - 1)} ${span ? 36 - (value - low) / span * 29 : 24}`).join(' ')
}

export function StatCards({ summary, trend }: { summary?: OverviewSummary; trend?: TrendPoint[] }) {
  const recent = trend?.slice(-7) ?? []
  const stats: { label: string; value?: number; caption: string; detail?: string; icon: LucideIcon; theme: string; values: number[] }[] = [
    { label: '总注册用户', value: summary?.totalUsers, caption: '近 7 天新增', detail: summary && formatNumber(summary.newUsersLastSevenDays), icon: UsersRound, theme: 'orange', values: recent.map(day => day.users) },
    { label: '有效会员', value: summary?.activeMembers, caption: '会员占比', detail: summary && formatShare(summary.memberShare), icon: Crown, theme: 'green', values: recent.map(day => day.members) },
    { label: '今日新增用户', value: summary?.newUsersToday, caption: '较昨日', detail: summary && `${summary.usersDayChange > 0 ? '+' : ''}${formatNumber(summary.usersDayChange)}`, icon: UserRoundPlus, theme: 'purple', values: recent.map(day => day.users) },
  ]
  return (
    <section className="stat-grid" aria-label="关键指标">
      {stats.map(({ icon: Icon, label, value, caption, detail, theme, values }) => (
        <Card key={label} className={`stat-card stat-${theme}`} aria-label={label}>
          <span className="stat-icon"><Icon size={27} strokeWidth={2.25} aria-hidden="true" fill={theme === 'green' ? 'currentColor' : 'none'} /></span>
          <div className="stat-copy">
            <h2>{label}</h2>
            <p className="stat-value">{value === undefined ? '—' : formatNumber(value)}</p>
            <p className="stat-caption">{caption} <strong>{detail ?? '—'}</strong></p>
          </div>
          {values.length > 1 && <Sparkline path={sparkline(values)} />}
        </Card>
      ))}
    </section>
  )
}
