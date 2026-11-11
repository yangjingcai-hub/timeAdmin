import { Ban, CircleCheck, Clock3, Crown, History, KeyRound, LogOut, Mail, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserDetailPagination, UserDetailRequestState, UserDetailStatus, UserSubpageHeading } from './user-detail-components'
import { detailPath, formatDetailTime, useUserDetailRequest, type DetailTone, type UserAuditData } from './user-detail-api'

const logTypes: Record<string, { label: string; icon: LucideIcon; tone: DetailTone }> = {
  disable: { label: '禁用账号', icon: Ban, tone: 'red' },
  'sign-out': { label: '强制退出设备', icon: LogOut, tone: 'neutral' },
  restore: { label: '恢复账号', icon: CircleCheck, tone: 'green' },
  'reset-password': { label: '发送重置邮件', icon: Mail, tone: 'blue' },
  'admin.password.change': { label: '修改自身密码', icon: KeyRound, tone: 'blue' },
  'membership.grant': { label: '授予会员', icon: Crown, tone: 'orange' },
  'membership.revoke': { label: '撤销会员', icon: Crown, tone: 'red' },
  'membership.retry-activation': { label: '重试开通会员', icon: Crown, tone: 'orange' },
}
export function UserLogsPage({ userId }: { userId: string }) {
  const [page, setPage] = useState(1)
  const pageSize = 5
  const logs = useUserDetailRequest<UserAuditData>(detailPath(userId, `audit?page=${page}&pageSize=${pageSize}`), userId)
  return <div className="user-detail-subpage user-logs-page">
    <UserSubpageHeading title="操作日志" icon={Clock3} description="记录管理员对该用户的关键操作，便于审计与问题追溯。" />
    {!logs.data ? <UserDetailRequestState request={logs} /> : <>
      <div className="user-subpage-table-frame">
        <Table className="user-subpage-table user-logs-table" aria-label="用户操作日志">
          <TableHeader><TableRow>{['操作时间', '操作管理员', '操作类型', '操作内容', '操作结果', '备注'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{logs.data.items.map(log => {
            const { icon: Icon, label, tone } = logTypes[log.type] ?? { icon: History, label: log.type || '—', tone: 'neutral' }
            return <TableRow key={log.id}>
              <TableCell>{formatDetailTime(log.time, true)}</TableCell><TableCell>{log.admin || '—'}</TableCell>
              <TableCell><UserDetailStatus tone={tone}><Icon size={17} strokeWidth={1.9} aria-hidden="true" />{label}</UserDetailStatus></TableCell>
              <TableCell className="user-log-content">{log.content || '—'}</TableCell>
              <TableCell><UserDetailStatus tone={log.result === 'success' ? 'green' : log.result === 'failure' ? 'red' : 'neutral'}>{log.result === 'success' ? '成功' : log.result === 'failure' ? '失败' : log.result || '—'}</UserDetailStatus></TableCell>
              <TableCell className="user-log-note">{log.note || '—'}</TableCell>
            </TableRow>
          })}{!logs.data.items.length && <TableRow><TableCell colSpan={6} className="user-detail-empty-cell">暂无操作记录</TableCell></TableRow>}</TableBody>
        </Table>
      </div>
      <UserDetailPagination total={logs.data.total} page={logs.data.page} pageSize={pageSize} onChange={setPage} />
    </>}
  </div>
}
