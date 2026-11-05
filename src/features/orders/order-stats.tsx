import { CircleAlert, CircleCheck, NotebookText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/sparkline'
import { formatOrderCount, formatOrderShare, orderRanges, type OrderRange } from './order-model'
import type { OrderStat } from './order-api'

const cards = {
  total: { title: '累计订单', icon: NotebookText },
  paid: { title: '已支付订单', icon: CircleCheck },
  exceptions: { title: '待处理异常', icon: CircleAlert },
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

export function OrderStats({ stats, range, exceptionsSelected, onExceptions }: {
  stats?: OrderStat[]; range: OrderRange; exceptionsSelected: boolean; onExceptions: () => void
}) {
  return (
    <section className="stat-grid order-stats" aria-label="订单统计">
      {(Object.keys(cards) as OrderStat['key'][]).map(key => {
        const stat = stats?.find(item => item.key === key)
        const { title, icon: Icon } = cards[key]
        const content = <>
          <span className="stat-icon"><Icon size={27} strokeWidth={2.1} aria-hidden="true" /></span>
          <div className="stat-copy">
            <span className="order-stat-label" role="heading" aria-level={2}>{title}</span>
            <p className="stat-value">{stat ? formatOrderCount(stat.count) : '—'}</p>
            <p className="stat-caption">{key === 'exceptions' ? '支付成功但会员未开通的订单'
              : key === 'total' ? (range === 'all' ? '全部历史订单' : orderRanges[range].label + '创建')
              : stat ? `占比 ${formatOrderShare(stat.share)}` : '正在读取数据'}</p>
          </div>
          {key !== 'exceptions' && stat && <Sparkline path={trendPath(stat.trend)} />}
        </>
        return (
          <Card key={key} className={`stat-card order-metric-${key}`} aria-label={title}>
            {key === 'exceptions' ? <button type="button" className="order-exception-trigger"
              aria-label="查看待处理异常订单" aria-pressed={exceptionsSelected} disabled={!stat} onClick={onExceptions}>{content}</button> : content}
          </Card>
        )
      })}
    </section>
  )
}
