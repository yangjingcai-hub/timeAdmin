import { Check, CircleCheck, Copy, Crown, FileText, Pencil, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { OrdersPage } from '@/features/orders/order-api'
import { paymentStatuses, plans } from '@/features/orders/order-types'
import { UserDetailPagination, UserDetailRequestState, UserDetailStatus, UserSubpageCard, UserSubpageHeading } from './user-detail-components'
import { detailPath, formatDetailTime, toUserDetailOrder, useUserDetailRequest, type UserCurrentMembership, type UserDetailOrder, type UserMembershipData } from './user-detail-api'
import type { User } from './user-types'
import { UserMembershipAdjustment } from './user-membership-adjustment'

const formatMoney = (amount: number) => `¥ ${amount.toFixed(2)}`
const pageSize = 5

function PaymentStatus({ order }: { order: UserDetailOrder }) {
  const paid = order.payment === 'paid'
  const Icon = paid ? CircleCheck : RotateCcw
  return <UserDetailStatus tone={paid ? 'green' : 'neutral'}>
    <Icon size={14} aria-hidden="true" />{paymentStatuses[order.payment]}
  </UserDetailStatus>
}

function OrderNumberCopy({ number, label = `复制订单编号 ${number}` }: { number: string; label?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  return <span className="user-order-copy">
    <span>{number}</span>
    <button type="button" aria-label={label} title={copyState === 'copied' ? '已复制' : '复制订单编号'} onClick={async () => {
      try { await navigator.clipboard.writeText(number); setCopyState('copied') }
      catch { setCopyState('failed') }
    }}>{copyState === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button>
    {copyState !== 'idle' && <small role="status">{copyState === 'copied' ? '已复制' : '复制失败，请手动复制'}</small>}
  </span>
}

function MembershipSummary({ membership }: { membership: UserCurrentMembership | null }) {
  if (!membership) return <div className="user-membership-empty">
    <span><Crown size={39} strokeWidth={1.6} aria-hidden="true" /></span>
    <h4>当前未开通会员</h4><p>该用户暂无有效的会员资格</p>
  </div>
  return <dl className="user-membership-summary">
    <div><dt>会员套餐</dt><dd>{plans[membership.plan as keyof typeof plans]?.label ?? membership.plan}</dd></div>
    <div><dt>获得方式</dt><dd>{membership.source === 'order' ? '订单购买' : membership.source === 'manual' ? '人工授权' : '—'}</dd></div>
    <div><dt>开通时间</dt><dd>{formatDetailTime(membership.startsAtUtc)}</dd></div>
    <div><dt>到期时间</dt><dd>{membership.plan === 'lifetime' && !membership.expiresAtUtc ? '永久有效' : formatDetailTime(membership.expiresAtUtc)}</dd></div>
    <div className="user-membership-order"><dt>关联订单</dt><dd>{membership.orderNumber
      ? <OrderNumberCopy key={membership.orderNumber} number={membership.orderNumber} label="复制关联订单编号" /> : '—'}</dd></div>
  </dl>
}

export function UserMembershipPage({ user, onMembershipChanged }: { user: User; onMembershipChanged: () => void }) {
  const membership = useUserDetailRequest<UserMembershipData>(detailPath(user.id, 'membership'), user.id)
  const [page, setPage] = useState(1)
  const [adjusting, setAdjusting] = useState(false)
  const query = new URLSearchParams({ userId: user.id, status: 'paid-or-refunded', page: String(page), pageSize: String(pageSize) })
  const orders = useUserDetailRequest<OrdersPage>(`/api/v1/admin/orders?${query}`, user.id, 'orders')
  const history = orders.data
  const first = history ? (history.page - 1) * pageSize + 1 : 0

  return <div className="user-detail-subpage user-membership-page">
    <UserSubpageHeading title="会员与订单" icon={Crown} description="查看用户的会员资格及历史购买记录。" />
    <div className="user-subpage-stack">
      <UserSubpageCard title="当前会员" icon={Crown} action={<div className="user-membership-actions">
        {membership.data && <UserDetailStatus tone={membership.data.current ? 'green' : 'neutral'}>{membership.data.current
          ? <><CircleCheck size={15} aria-hidden="true" />有效</> : '非会员'}</UserDetailStatus>}
        <Button type="button" variant="ghost" className="user-membership-adjust-button" onClick={() => setAdjusting(true)}><Pencil size={15} aria-hidden="true" />调整会员</Button>
      </div>}>
        {membership.data ? <MembershipSummary membership={membership.data.current} /> : <UserDetailRequestState request={membership} />}
      </UserSubpageCard>
      <UserSubpageCard title="历史订单" icon={FileText} action={history && <span className="user-orders-count">共 {history.total} 笔</span>}>
        {!history ? <UserDetailRequestState request={orders} /> : <>
          <div className="user-subpage-table-frame user-order-history">
            <Table className="user-subpage-table user-orders-table" aria-label="用户历史订单">
              <TableHeader><TableRow>{['订单编号', '会员套餐', '订单金额', '支付状态', '创建时间'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{history.items.map(toUserDetailOrder).map(order => <TableRow key={order.orderId}>
                <TableCell className="user-order-number"><OrderNumberCopy number={order.id} /></TableCell>
                <TableCell>{order.plan}</TableCell><TableCell>{formatMoney(order.amount)}</TableCell>
                <TableCell><PaymentStatus order={order} /></TableCell><TableCell>{order.createdAt}</TableCell>
              </TableRow>)}{!history.items.length && <TableRow><TableCell colSpan={5} className="user-detail-empty-cell">暂无历史订单</TableCell></TableRow>}</TableBody>
            </Table>
          </div>
          {history.total > pageSize && <UserDetailPagination total={history.total} page={history.page} pageSize={pageSize} onChange={setPage} label="订单"
            summary={`显示 ${first}–${first + history.items.length - 1} 条，共 ${history.total} 条`} />}
        </>}
      </UserSubpageCard>
    </div>
    {adjusting && <UserMembershipAdjustment user={user} onClose={() => setAdjusting(false)} onSuccess={() => {
      setAdjusting(false)
      membership.retry()
      onMembershipChanged()
    }} />}
  </div>
}
