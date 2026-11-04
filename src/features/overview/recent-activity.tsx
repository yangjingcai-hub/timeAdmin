import { ChevronRight, FileText, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { recentOrders, recentUsers, type OrderStatus } from './mock-data'

const orderLabels: Record<OrderStatus, string> = { paid: '已支付', pending: '待支付', canceled: '已取消' }

function MorePlaceholder() {
  return <span className="more-placeholder" role="link" aria-disabled="true" title="暂未开放">查看更多<ChevronRight size={14} aria-hidden="true" /></span>
}

export function RecentOrders() {
  return (
    <Card className="panel table-panel" aria-labelledby="orders-title">
      <CardHeader className="panel-header">
        <CardTitle className="activity-title" id="orders-title"><FileText size={20} aria-hidden="true" />最新订单</CardTitle>
        <MorePlaceholder />
      </CardHeader>
      <Table className="activity-table orders-table" aria-labelledby="orders-title">
        <TableHeader><TableRow><TableHead>订单号</TableHead><TableHead>用户邮箱</TableHead><TableHead>套餐</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead></TableRow></TableHeader>
        <TableBody>
          {recentOrders.map(({ id, email, plan, status, createdAt }) => (
            <TableRow key={id}>
              <TableCell>{id}</TableCell><TableCell>{email}</TableCell><TableCell>{plan}</TableCell>
              <TableCell><Badge className={`status-${status}`}>{orderLabels[status]}</Badge></TableCell>
              <TableCell>{createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export function RecentUsers() {
  return (
    <Card className="panel table-panel" aria-labelledby="users-title">
      <CardHeader className="panel-header">
        <CardTitle className="activity-title" id="users-title"><UserRound size={20} aria-hidden="true" />最新注册用户</CardTitle>
        <MorePlaceholder />
      </CardHeader>
      <Table className="activity-table users-table" aria-labelledby="users-title">
        <TableHeader><TableRow><TableHead>用户邮箱</TableHead><TableHead>注册时间</TableHead></TableRow></TableHeader>
        <TableBody>
          {recentUsers.map(({ email, avatar, registeredAt }) => (
            <TableRow key={email}>
              <TableCell><div className="user-cell"><Avatar aria-hidden="true" className="size-8 bg-muted"><svg width="32" height="32"><use href={`/user-avatars.svg#${avatar}`} /></svg></Avatar><span title={email}>{email}</span></div></TableCell>
              <TableCell>{registeredAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
