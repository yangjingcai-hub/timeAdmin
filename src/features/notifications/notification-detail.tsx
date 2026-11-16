import * as Dialog from '@radix-ui/react-dialog'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import { formatNotificationTime, notificationCount, notificationStatus, notificationTitles, type AdminNotification } from './notification-data'

interface NotificationDetailProps {
  notice: AdminNotification | null | undefined
  failed: boolean
  onRetry: () => void
  onClose: () => void
  restoreFocus: () => void
}

export function NotificationDetail({ notice, failed, onRetry, onClose, restoreFocus }: NotificationDetailProps) {
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="detail-overlay" />
      <DetailDrawerContent title="通知详情" description={notice ? notificationTitles[notice.kind] ?? '通知' : '查看通知记录。'}
        restoreFocus={restoreFocus}>
        {failed && <div role="alert">通知详情读取失败。<Button type="button" variant="ghost" onClick={onRetry}>重试</Button></div>}
        {notice === null && !failed && <p role="status">通知不存在或已被移除。</p>}
        {notice === undefined && !failed && <p role="status">正在读取通知…</p>}
        {notice && <>
          <section className="detail-section" aria-label="记录">
            <h3>{notice.description}</h3>
            <dl>
              <div><dt>状态</dt><dd>{notificationStatus(notice)}</dd></div>
              <div><dt>首次发生</dt><dd>{formatNotificationTime(notice.occurredAtUtc, false)}</dd></div>
              {notice.lastOccurredAtUtc && <div><dt>最近发生</dt><dd>{formatNotificationTime(notice.lastOccurredAtUtc, false)}</dd></div>}
              {notice.handledAtUtc && <div><dt>{notice.resolution === 'recovered' ? '恢复时间' : '完成时间'}</dt><dd>{formatNotificationTime(notice.handledAtUtc, false)}</dd></div>}
              {notice.occurrenceCount !== undefined && <div>
                <dt>{['api-rate', 'login'].includes(notice.kind) ? '最近窗口次数' : '发生次数'}</dt><dd>{notificationCount(notice.occurrenceCount)}</dd>
              </div>}
            </dl>
          </section>
          {notice.auditId && <Button asChild><Link to={`/audit?logId=${encodeURIComponent(notice.auditId)}`}>查看操作日志</Link></Button>}
          {notice.kind === 'system' && <Button asChild variant="ghost"><Link to="/monitor">查看当前系统状态</Link></Button>}
        </>}
      </DetailDrawerContent>
    </Dialog.Portal>
  </Dialog.Root>
}
