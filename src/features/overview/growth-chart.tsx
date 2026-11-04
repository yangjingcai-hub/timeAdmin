import { useId, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, ranges, trends, type TrendPoint, type TrendRange } from './mock-data'

const series = [
  { key: 'users', name: '新增用户', color: '#ff790d' },
  { key: 'members', name: '新增会员', color: '#a898ff' },
] as const

function TrendTooltip({ point }: { point: TrendPoint }) {
  return (
    <div className="trend-tooltip">
      <p>{point.date}（{point.day}）</p>
      {series.map(({ key, name, color }) => (
        <div className="tooltip-row" key={key}><i style={{ background: color }} />{name}<strong>{formatNumber(point[key])}</strong></div>
      ))}
    </div>
  )
}

export function GrowthChart() {
  const [range, setRange] = useState<TrendRange>(7)
  const gradientId = useId()
  const data = trends[range]
  const ticks = Array.from({ length: 7 }, (_, i) => data[Math.round(i * (data.length - 1) / 6)].date)

  return (
    <Card className="panel growth-panel" aria-labelledby="growth-title">
      <CardHeader className="panel-header">
        <CardTitle id="growth-title">用户增长趋势</CardTitle>
        <div className="range-switch" role="group" aria-label="趋势时间范围">
          {ranges.map((days) => (
            <Button key={days} type="button" variant="ghost" size="sm" aria-pressed={range === days} onClick={() => setRange(days)}>
              近 {days} 天
            </Button>
          ))}
        </div>
      </CardHeader>
      <ul className="chart-legend" aria-label="趋势图图例">
        {series.map(({ key, name, color }) => <li key={key}><i style={{ background: color }} />{name}</li>)}
      </ul>
      <div className="growth-plot" aria-label={`近 ${range} 天新增用户与会员趋势`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 6, right: 13, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff9b51" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#ff9b51" stopOpacity={0.025} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef0f6" />
            <XAxis dataKey="date" ticks={ticks} interval="preserveStartEnd" minTickGap={8} tickMargin={9} tickLine={false} axisLine={{ stroke: '#e9ecf4' }} tick={{ fill: '#5e6880', fontSize: 13 }} padding={{ left: 14, right: 13 }} />
            <YAxis width={41} tickMargin={9} domain={[0, 300]} ticks={[0, 60, 120, 180, 240, 300]} tickLine={false} axisLine={{ stroke: '#e9ecf4' }} tick={{ fill: '#5e6880', fontSize: 13 }} />
            <Tooltip cursor={{ stroke: '#ffbc8b', strokeDasharray: '4 3' }} offset={14} content={({ active, payload }) => {
              const point = payload?.[0]?.payload as TrendPoint | undefined
              return active && point ? <TrendTooltip point={point} /> : null
            }} />
            {series.map(({ key, name, color }) => (
              <Area key={key} type="monotone" dataKey={key} name={name} stroke={color} strokeWidth={2} fill={key === 'users' ? `url(#${gradientId})` : 'transparent'}
                dot={range === 7 ? { r: 4, fill: '#fff', stroke: color, strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
