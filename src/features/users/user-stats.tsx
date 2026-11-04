import { Ban, Crown, UserRoundPlus, UsersRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatUserCount } from './user-display'

export interface UserStatsData {
  total: number
  members: number
  today: number
  disabled: number
}

const metrics = [
  { key: 'total', label: '全部用户', caption: '累计注册账号', icon: UsersRound, tone: 'orange' },
  { key: 'members', label: '有效会员', caption: '当前拥有会员权限', icon: Crown, tone: 'green' },
  { key: 'today', label: '今日新增', caption: '今日注册用户', icon: UserRoundPlus, tone: 'purple' },
  { key: 'disabled', label: '已禁用账号', caption: '因违规或异常被禁用', icon: Ban, tone: 'red' },
] as const

export function UserStats({ data }: { data: UserStatsData }) {
  return (
    <section className="stat-grid user-stats" aria-label="用户统计">
      {metrics.map(({ key, label, caption, icon: Icon, tone }) => (
        <Card key={key} className={`stat-card stat-${tone}`} aria-label={label}>
          <span className="stat-icon"><Icon size={27} strokeWidth={2.25} aria-hidden="true" fill={tone === 'green' ? 'currentColor' : 'none'} /></span>
          <div className="stat-copy">
            <h2>{label}</h2>
            <p className="stat-value">{formatUserCount(data[key])}</p>
            <p className="stat-caption">{caption}</p>
          </div>
        </Card>
      ))}
    </section>
  )
}
