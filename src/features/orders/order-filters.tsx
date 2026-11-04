import { CalendarDays, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListSearch, ListSelect } from '@/components/ui/list-controls'
import { paymentMethods, paymentStatuses, plans } from './mock-orders'
import { orderRanges, type OrderFilters as FilterValues, type OrderRange } from './order-model'

export function OrderRangeSelect({ range, onChange }: { range: OrderRange; onChange: (range: OrderRange) => void }) {
  return (
    <label className="order-range">
      <CalendarDays size={17} aria-hidden="true" />
      <select aria-label="订单时间范围" value={range} onChange={(event) => onChange(event.target.value as OrderRange)}>
        {Object.entries(orderRanges).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  )
}

interface OrderFiltersProps {
  values: FilterValues
  onChange: (values: FilterValues) => void
  onExport: () => void
  canExport: boolean
}

export function OrderFilters({ values, onChange, onExport, canExport }: OrderFiltersProps) {
  return (
    <div className="order-filters" role="group" aria-label="订单搜索与筛选">
      <ListSearch aria-label="搜索订单号或用户邮箱" placeholder="搜索订单号 / 用户邮箱" value={values.query}
        onChange={(event) => onChange({ ...values, query: event.target.value })} />
      <ListSelect label="订单状态" value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value as FilterValues['status'] })}>
        <option value="all">全部</option>
        {Object.entries(paymentStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </ListSelect>
      <ListSelect label="会员套餐" value={values.plan} onChange={(event) => onChange({ ...values, plan: event.target.value as FilterValues['plan'] })}>
        <option value="all">全部</option>
        {Object.entries(plans).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
      </ListSelect>
      <ListSelect label="支付方式" value={values.method} onChange={(event) => onChange({ ...values, method: event.target.value as FilterValues['method'] })}>
        <option value="all">全部</option>
        {Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </ListSelect>
      <Button type="button" variant="ghost" className="list-export-button order-export-button" disabled={!canExport} onClick={onExport}>
        <Download size={17} aria-hidden="true" />导出订单
      </Button>
    </div>
  )
}
