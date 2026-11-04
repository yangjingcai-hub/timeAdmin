import { CircleCheck, CircleX, Clock3, NotebookText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/sparkline'
import { formatOrderCount, formatOrderShare, orderRanges, type getOrderStats, type OrderRange } from './order-model'

const cards = {
  total: { title: '累计订单', icon: NotebookText },
  paid: { title: '已支付订单', icon: CircleCheck },
  pending: { title: '待支付订单', icon: Clock3 },
  closed: { title: '已关闭订单', icon: CircleX },
}

function trendPath(values: number[]) {
  const min = Math.min(...values)
  const span = Math.max(...values) - min
  const points = values.map((value, index) => ({
    x: 1 + 93 * index / (values.length - 1),
    y: span ? 34 - 27 * (value - min) / span : 23,
  }))

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`
    const prev = points[index - 1]
    const midX = (prev.x + point.x) / 2
    return `${path} C${midX} ${prev.y} ${midX} ${point.y} ${point.x} ${point.y}`
  }, '')
}

export function OrderStats({ stats, range }: { stats: ReturnType<typeof getOrderStats>; range: OrderRange }) {
  return (
    <section className="stat-grid order-stats" aria-label="订单统计">
      {stats.map(({ key, count, share, trend }) => {
        const { title, icon: Icon } = cards[key]
        return (
          <Card key={key} className={`stat-card order-metric-${key}`} aria-label={title}>
            <span className="stat-icon"><Icon size={25} strokeWidth={2.2} aria-hidden="true" /></span>
            <div className="stat-copy">
              <h2>{title}</h2>
              <p className="stat-value">{formatOrderCount(count)}</p>
              <p className="stat-caption">{key === 'total' ? (range === 'all' ? '全部历史订单' : orderRanges[range].label + '创建') : `占比 ${formatOrderShare(share)}`}</p>
            </div>
            <Sparkline path={trendPath(trend)} />
          </Card>
        )
      })}
    </section>
  )
}
