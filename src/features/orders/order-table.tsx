import { ArrowDown, Crown, Info, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListEmpty } from '@/components/ui/list-controls'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { activationStatuses, paymentStatuses, plans, type ActivationStatus, type Order, type PaymentStatus, type Plan } from './order-types'
import { formatAmount } from './order-model'

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge className={`order-badge order-payment-${status}`}>{paymentStatuses[status]}</Badge>
}

export function OrderPlanLabel({ plan }: { plan: Plan }) {
  const Icon = plan === 'monthly' ? UserRound : Crown
  return <span className="order-plan"><span className="order-plan-icon"><Icon size={13} aria-hidden="true" /></span>{plans[plan].label}</span>
}

export function ActivationBadge({ status }: { status: ActivationStatus; compact?: boolean; exception?: boolean }) {
  if (status === 'notStarted') {
    return <span className="order-missing" aria-label="无需发放">—</span>
  }

  return (
    <Badge className={`order-badge order-activation-${status}`}>
      {activationStatuses[status]}
    </Badge>
  )
}

interface OrderTableProps {
  orders: Order[]
  onDetails: (order: Order, trigger: HTMLButtonElement) => void
  onClearFilters: () => void
  exceptionOnly: boolean
}

export function OrderTable({ orders, onDetails, onClearFilters, exceptionOnly }: OrderTableProps) {
  return (
    <div className="list-table-frame">
      <Table className="list-data-table order-table" aria-label="订单列表">
        <TableHeader>
          <TableRow>
            <TableHead>订单编号</TableHead>
            <TableHead>用户邮箱</TableHead>
            <TableHead>会员套餐</TableHead>
            <TableHead>订单金额</TableHead>
            <TableHead><span className="order-sort-heading">订单状态 <Info size={13} aria-label="支付与退款状态" /></span></TableHead>
            <TableHead><span className="order-sort-heading">权益状态 <Info size={13} aria-label="本订单的会员权益发放状态" /></span></TableHead>
            <TableHead aria-sort="descending"><span className="order-sort-heading">创建时间 <ArrowDown size={13} aria-hidden="true" /></span></TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            return (
              <TableRow key={order.id} data-exception={exceptionOnly || undefined}>
                <TableCell className="order-code">{order.id}</TableCell>
                <TableCell>{order.email}</TableCell>
                <TableCell><OrderPlanLabel plan={order.plan} /></TableCell>
                <TableCell className="order-amount">{formatAmount(order.amountCents)}</TableCell>
                <TableCell><PaymentBadge status={order.payment.status} /></TableCell>
                <TableCell><ActivationBadge status={order.activation} compact exception={order.payment.status === 'paid' && order.activation !== 'activated'} /></TableCell>
                <TableCell><time dateTime={order.createdAt.replace(' ', 'T')}>{order.createdAt.slice(5)}</time></TableCell>
                <TableCell className="order-action">
                  <Button type="button" variant="ghost" size="sm" className="order-details-button" aria-label={`详情 ${order.id}`}
                    onClick={(event) => onDetails(order, event.currentTarget)}>详情</Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {orders.length === 0 && <ListEmpty message="没有找到匹配的订单" onClear={onClearFilters} />}
    </div>
  )
}
