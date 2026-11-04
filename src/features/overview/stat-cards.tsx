import { Crown, UserRoundPlus, UsersRound, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/sparkline'
import { activeMembers, formatNumber, formatShare, summary } from './mock-data'

const stats: { label: string; value: number; caption: string; detail: string; icon: LucideIcon; theme: string; sparkline: string }[] = [
  { label: '总注册用户', value: summary.totalUsers, caption: '较上 7 天', detail: `+${summary.usersWeekChange}`, icon: UsersRound, theme: 'orange', sparkline: 'M1 36C9 29 13 18 23 23S41 34 53 17 69 14 75 15 86 12 94 5' },
  { label: '有效会员', value: activeMembers, caption: '会员占比', detail: formatShare(activeMembers / summary.totalUsers), icon: Crown, theme: 'green', sparkline: 'M1 30C11 22 15 13 27 17S45 27 57 15 71 2 80 7 90 7 94 4' },
  { label: '今日新增用户', value: summary.newUsersToday, caption: '较昨日', detail: `+${summary.usersDayChange}`, icon: UserRoundPlus, theme: 'purple', sparkline: 'M1 30C13 18 18 12 30 17S46 27 60 13 76 6 83 8 91 6 94 4' },
]

export function StatCards() {
  return (
    <section className="stat-grid" aria-label="关键指标">
      {stats.map(({ icon: Icon, label, value, caption, detail, theme, sparkline }) => (
        <Card key={label} className={`stat-card stat-${theme}`} aria-label={label}>
          <span className="stat-icon"><Icon size={27} strokeWidth={2.25} aria-hidden="true" fill={theme === 'green' ? 'currentColor' : 'none'} /></span>
          <div className="stat-copy">
            <h2>{label}</h2>
            <p className="stat-value">{formatNumber(value)}</p>
            <p className="stat-caption">{caption} <strong>{detail}</strong></p>
          </div>
          <Sparkline path={sparkline} />
        </Card>
      ))}
    </section>
  )
}
