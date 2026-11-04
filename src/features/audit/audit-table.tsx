import { Crown, Layers3, NotebookText, Settings, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListEmpty } from '@/components/ui/list-controls'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { auditCategories, type AuditLog, type AuditStatus } from './audit-data'

const categoryIcons = { users: UserRound, orders: NotebookText, plans: Layers3, settings: Settings }
const columns = ['操作时间', '操作管理员', '操作类型', '操作内容', '操作结果', '操作来源', '操作']

export function AuditStatusBadge({ status, detail = false }: { status: AuditStatus; detail?: boolean }) {
  return <Badge className="audit-status" data-result={status}>{detail ? '执行' : ''}{status === 'success' ? '成功' : '失败'}</Badge>
}

interface AuditTableProps {
  logs: AuditLog[]
  selectedId?: string
  onDetails: (log: AuditLog, trigger: HTMLButtonElement) => void
  onClear: () => void
}

export function AuditTable({ logs, selectedId, onDetails, onClear }: AuditTableProps) {
  return (
    <div className="list-table-frame audit-table-frame">
      <Table className="list-data-table audit-table" aria-label="操作日志列表">
        <TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {logs.map((log) => {
            const membership = log.category === 'users' && log.action.includes('会员')
            const Icon = membership ? Crown : categoryIcons[log.category]
            return (
              <TableRow key={log.id} data-selected={log.id === selectedId}>
                <TableCell><time dateTime={log.occurredAt.replace(' ', 'T')}>{log.occurredAt}</time></TableCell>
                <TableCell>{log.administrator}</TableCell>
                <TableCell><Badge className="audit-category" data-category={membership ? 'membership' : log.category}><Icon size={15} aria-hidden="true" />{auditCategories[log.category]}</Badge></TableCell>
                <TableCell className="audit-action-name">{log.action}</TableCell>
                <TableCell><AuditStatusBadge status={log.result.status} /></TableCell>
                <TableCell>{log.source}</TableCell>
                <TableCell className="audit-details-cell">
                  <Button type="button" variant="ghost" size="sm" className="audit-details-button" aria-haspopup="dialog" aria-expanded={log.id === selectedId}
                    aria-label={`详情 · ${log.action} · ${log.occurredAt}`} onClick={(event) => onDetails(log, event.currentTarget)}>详情</Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {logs.length === 0 && <ListEmpty message="没有找到匹配的操作日志" onClear={onClear} />}
    </div>
  )
}
