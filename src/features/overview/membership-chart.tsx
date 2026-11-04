import { useId } from 'react'
import { Pie, PieChart, ResponsiveContainer, Sector } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { activeMembers, formatNumber, formatShare, membership } from './mock-data'

export function MembershipChart() {
  const id = useId()
  const stops = ['#ff8c13', '#ffccaa', '#b5a7ff']

  return (
    <Card className="panel membership-panel" aria-labelledby="membership-title">
      <CardHeader className="panel-header"><CardTitle id="membership-title">会员分布</CardTitle></CardHeader>
      <div className="membership-content">
        <div className="membership-donut">
          <div className="donut-plot" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>{membership.map(({ name, color }, index) => (
                  <linearGradient key={name} id={`${id}-${index}`} x2="100%" y2="100%"><stop stopColor={stops[index]} /><stop offset="1" stopColor={color} /></linearGradient>
                ))}</defs>
                <Pie data={membership} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="64%" outerRadius="99%" startAngle={90} endAngle={-270}
                  stroke="#fff" strokeWidth={1} isAnimationActive={false} shape={({ index, ...sector }) => <Sector {...sector} fill={`url(#${id}-${index})`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="donut-label"><strong>{formatNumber(activeMembers)}</strong><span>有效会员</span></div>
        </div>
        <ul className="member-legend" aria-label="各套餐会员数量与占比">
          {membership.map(({ name, value, color }) => (
            <li key={name}><i style={{ background: color }} /><span>{name}</span><span className="member-share">{formatShare(value / activeMembers)}</span><strong>{formatNumber(value)}</strong></li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
