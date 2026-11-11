import { CalendarDays, ClipboardList, CreditCard, Download, Layers } from 'lucide-react'
import type { Ref } from 'react'
import { Button } from '@/components/ui/button'
import { ListSearch, ListSelect } from '@/components/ui/list-controls'
import { paymentMethods, paymentStatuses, plans } from './order-types'
import { orderRanges, type OrderFilters as FilterValues, type OrderRange } from './order-model'

interface OrderFiltersProps {
  values: FilterValues
  onChange: (values: FilterValues) => void
  onExport: () => void
  canExport: boolean
  range: OrderRange
  onRange: (range: OrderRange) => void
  searchRef: Ref<HTMLInputElement>
}

export function OrderFilters({ values, onChange, onExport, canExport, range, onRange, searchRef }: OrderFiltersProps) {
  return (
    <div className="order-filters" role="group" aria-label="订单搜索与筛选">
      <ListSearch ref={searchRef} aria-label="搜索订单号或用户邮箱" placeholder="搜索订单号 / 用户邮箱" value={values.query}
        onChange={(event) => onChange({ ...values, query: event.target.value })} />
      <ListSelect label="订单状态" icon={ClipboardList} hideLabel value={values.status} onChange={(event) => onChange({
        ...values, status: event.target.value as FilterValues['status'], exceptionOnly: values.exceptionOnly && event.target.value === 'paid',
      })}>
        <option value="all">全部订单</option>
        {(['pending', 'paid', 'closed', 'refunded'] as const).map(value => <option key={value} value={value}>{paymentStatuses[value]}</option>)}
      </ListSelect>
      <ListSelect label="会员套餐" icon={Layers} hideLabel value={values.plan} onChange={(event) => onChange({ ...values, plan: event.target.value as FilterValues['plan'] })}>
        <option value="all">全部套餐</option>
        {Object.entries(plans).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
      </ListSelect>
      <ListSelect label="支付方式" icon={CreditCard} hideLabel value={values.method} onChange={(event) => onChange({ ...values, method: event.target.value as FilterValues['method'] })}>
        <option value="all">全部方式</option>
        {Object.entries(paymentMethods).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </ListSelect>
      <ListSelect label="订单时间范围" icon={CalendarDays} hideLabel value={range} onChange={event => onRange(event.target.value as OrderRange)}>
        {Object.entries(orderRanges).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
      </ListSelect>
      <Button type="button" variant="ghost" className="list-export-button order-export-button" aria-label="导出订单" disabled={!canExport} onClick={onExport}>
        <Download size={17} aria-hidden="true" />导出
      </Button>
    </div>
  )
}
