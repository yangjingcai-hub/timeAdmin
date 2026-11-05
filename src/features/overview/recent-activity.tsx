import { ChevronRight, FileText, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatActivityTime, planNames, type RecentOrder, type RecentUser } from './overview-api'

const orderLabels: Record<string, string> = { paid: '已支付', pending: '待支付', expired: '已过期', canceled: '已取消', closed: '已关闭' }

function MoreLink({ to }: { to: string }) {
  return <Link className="more-placeholder" to={to}>查看更多<ChevronRight size={14} aria-hidden="true" /></Link>
}

export function RecentOrders({ orders, message }: { orders?: RecentOrder[]; message: string }) {
  return (
    <Card className="panel table-panel" aria-labelledby="orders-title">
      <CardHeader className="panel-header">
        <CardTitle className="activity-title" id="orders-title"><FileText size={20} aria-hidden="true" />最新订单</CardTitle>
        <MoreLink to="/orders" />
      </CardHeader>
      <Table className="activity-table orders-table" aria-labelledby="orders-title">
        <TableHeader><TableRow><TableHead>订单号</TableHead><TableHead>用户邮箱</TableHead><TableHead>套餐</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead></TableRow></TableHeader>
        <TableBody>
          {orders?.map(({ id, email, plan, status, createdAtUtc }) => (
            <TableRow key={id}>
              <TableCell className="overview-order-id" title={id}>{id}</TableCell><TableCell>{email}</TableCell><TableCell>{planNames[plan] ?? plan}</TableCell>
              <TableCell><Badge className={status === 'paid' || status === 'pending' ? `status-${status}` : 'status-canceled'}>{orderLabels[status] ?? status}</Badge></TableCell>
              <TableCell>{formatActivityTime(createdAtUtc)}</TableCell>
            </TableRow>
          ))}
          {!orders?.length && <TableRow><TableCell colSpan={5} className="overview-empty-cell">{orders ? '暂无订单' : message}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  )
}

export function RecentUsers({ users, message }: { users?: RecentUser[]; message: string }) {
  return (
    <Card className="panel table-panel" aria-labelledby="users-title">
      <CardHeader className="panel-header">
        <CardTitle className="activity-title" id="users-title"><UserRound size={20} aria-hidden="true" />最新注册用户</CardTitle>
        <MoreLink to="/users" />
      </CardHeader>
      <Table className="activity-table users-table" aria-labelledby="users-title">
        <TableHeader><TableRow><TableHead>用户邮箱</TableHead><TableHead>注册时间</TableHead></TableRow></TableHeader>
        <TableBody>
          {users?.map(({ id, email, avatarUrl, registeredAtUtc }) => (
            <TableRow key={id}>
              <TableCell><div className="user-cell"><Avatar aria-hidden="true" className="size-8 bg-muted">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}<AvatarFallback><UserRound size={16} /></AvatarFallback>
              </Avatar><span title={email}>{email}</span></div></TableCell>
              <TableCell>{formatActivityTime(registeredAtUtc)}</TableCell>
            </TableRow>
          ))}
          {!users?.length && <TableRow><TableCell colSpan={2} className="overview-empty-cell">{users ? '暂无注册用户' : message}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Card>
  )
}
