import { useId } from 'react'
import { Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatShare, planNames, type MembershipCount } from './overview-api'

export function MembershipChart({ membership, activeMembers = 0, message }: { membership?: MembershipCount[]; activeMembers?: number; message: string }) {
  const id = useId()
  const colors = ['#ff7908', '#ffb481', '#a58af9', '#64748b']
  const byKind = new Map(membership?.map(plan => [plan.kind, plan]))
  const kinds = new Set([...Object.keys(planNames), ...byKind.keys()])
  const rows = [...kinds].map((kind, index) => ({
    name: planNames[kind] ?? kind, value: byKind.get(kind)?.count ?? 0,
    share: byKind.get(kind)?.share ?? 0, color: colors[index % colors.length],
  }))

  return (
    <Card className="panel membership-panel" aria-labelledby="membership-title">
      <CardHeader className="panel-header"><CardTitle id="membership-title">会员分布</CardTitle></CardHeader>
      {!membership ? <p className="overview-placeholder">{message}</p> : <div className="membership-content">
        <div className="membership-donut">
          <div className="donut-plot" aria-hidden="true">
            {activeMembers === 0 ? <div className="overview-empty-ring" /> : <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>{rows.map(({ name, color }, index) => (
                  <linearGradient key={name} id={`${id}-${index}`} x2="100%" y2="100%"><stop stopColor={color} stopOpacity={0.75} /><stop offset="1" stopColor={color} /></linearGradient>
                ))}</defs>
                <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="64%" outerRadius="99%" startAngle={90} endAngle={-270}
                  stroke="#fff" strokeWidth={1} isAnimationActive={false} shape={({ index, ...sector }) => <Sector {...sector} fill={`url(#${id}-${index})`} />} />
              </PieChart>
            </ResponsiveContainer>}
          </div>
          <div className="donut-label"><strong>{formatNumber(activeMembers)}</strong><span>有效会员</span></div>
        </div>
        <ul className="member-legend" aria-label="各套餐会员数量与占比">
          {rows.map(({ name, value, share, color }) => (
            <li key={name}><i style={{ background: color }} /><span>{name}</span><span className="member-share">{formatShare(share)}</span><strong>{formatNumber(value)}</strong></li>
          ))}
        </ul>
      </div>}
    </Card>
  )
}
