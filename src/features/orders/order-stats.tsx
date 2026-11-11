import { CircleCheck, FileText, RotateCcw, TriangleAlert } from 'lucide-react'
import { formatOrderCount } from './order-model'
import type { OrderStat } from './order-api'

const cards = {
  total: { title: '累计订单', icon: FileText },
  paid: { title: '已支付订单', icon: CircleCheck },
  refunded: { title: '已退款订单', icon: RotateCcw },
  exceptions: { title: '待处理异常', icon: TriangleAlert },
}

export function OrderStats({ stats, selected, onSelect }: {
  stats?: OrderStat[]; selected: OrderStat['key'] | null; onSelect: (key: OrderStat['key']) => void
}) {
  return <section className="stat-grid order-stats" aria-label="订单统计">
    {(Object.keys(cards) as OrderStat['key'][]).map(key => {
      const stat = stats?.find(item => item.key === key)
      const { title, icon: Icon } = cards[key]
      return <button key={key} type="button" className={`stat-card order-metric-${key}`}
        aria-pressed={selected === key} onClick={() => onSelect(key)}>
        <span className="stat-icon"><Icon size={24} strokeWidth={2} aria-hidden="true" /></span>
        <span className="stat-copy"><span className="order-stat-label">{title}</span>
          <span className="stat-value">{stat ? formatOrderCount(stat.count) : '—'}</span></span>
      </button>
    })}
  </section>
}
