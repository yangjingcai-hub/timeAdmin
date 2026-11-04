import { ArrowDown, CircleCheck, Crown, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListEmpty } from '@/components/ui/list-controls'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { activationStatuses, paymentStatuses, plans, type ActivationStatus, type Order, type PaymentStatus } from './mock-orders'
import { formatAmount } from './order-model'

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge className={`order-badge order-payment-${status}`}>{paymentStatuses[status]}</Badge>
}

export function ActivationBadge({ status, compact = false }: { status: ActivationStatus; compact?: boolean }) {
  if (compact && status === 'notStarted') {
    return <><span className="order-missing" aria-hidden="true">—</span><span className="sr-only">未开通</span></>
  }

  return (
    <Badge className={`order-badge order-activation-${status}`}>
      {status === 'activated' && <CircleCheck size={13} aria-hidden="true" />}
      {activationStatuses[status]}
    </Badge>
  )
}

interface OrderTableProps {
  orders: Order[]
  onDetails: (order: Order, trigger: HTMLButtonElement) => void
  onClearFilters: () => void
}

export function OrderTable({ orders, onDetails, onClearFilters }: OrderTableProps) {
  return (
    <div className="list-table-frame">
      <Table className="list-data-table order-table" aria-label="订单列表">
        <TableHeader>
          <TableRow>
            <TableHead>订单编号</TableHead>
            <TableHead>用户邮箱</TableHead>
            <TableHead>会员套餐</TableHead>
            <TableHead>订单金额</TableHead>
            <TableHead>支付状态</TableHead>
            <TableHead>会员开通状态</TableHead>
            <TableHead aria-sort="descending"><span className="order-sort-heading">创建时间 <ArrowDown size={13} aria-hidden="true" /></span></TableHead>
            <TableHead>支付完成时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const PlanIcon = order.plan === 'monthly' ? UserRound : Crown
            return (
              <TableRow key={order.id}>
                <TableCell className="order-code">{order.id}</TableCell>
                <TableCell>{order.email}</TableCell>
                <TableCell><span className="order-plan"><span className="order-plan-icon"><PlanIcon size={13} aria-hidden="true" /></span>{plans[order.plan].label}</span></TableCell>
                <TableCell className="order-amount">{formatAmount(order.amountCents)}</TableCell>
                <TableCell><PaymentBadge status={order.payment.status} /></TableCell>
                <TableCell><ActivationBadge status={order.activation} compact /></TableCell>
                <TableCell><time dateTime={order.createdAt.replace(' ', 'T')}>{order.createdAt.slice(5)}</time></TableCell>
                <TableCell>{order.payment.completedAt
                  ? <time dateTime={order.payment.completedAt.replace(' ', 'T')}>{order.payment.completedAt.slice(5)}</time>
                  : <span className="order-missing">—</span>}</TableCell>
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
