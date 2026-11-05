import * as Dialog from '@radix-ui/react-dialog'
import { Crown, NotebookText, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import type { User } from './user-types'
import { membershipExpiry, membershipPlan } from './user-display'
import { AccountBadge, type UserAction } from './user-table'

export function UserDialog({ open, user, action, error, onClose, onRetry, restoreFocus }: {
  open: boolean; user: User | null; action: UserAction; error: string
  onClose: () => void; onRetry: () => void; restoreFocus: () => void
}) {
  const membershipOnly = action === 'membership'
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose() }}>
    <Dialog.Portal><Dialog.Overlay className="detail-overlay" />
      <DetailDrawerContent title={membershipOnly ? '会员信息' : '用户详情'}
        description={membershipOnly ? '查看此用户的会员状态与有效期。' : '查看账号、登录记录和会员信息。'} restoreFocus={restoreFocus}>
        {error ? <div className="user-request-state" role="alert"><p>{error}</p><Button variant="ghost" onClick={onRetry}>重试</Button></div>
          : !user ? <p role="status">正在加载用户详情…</p> : <>
            <div className="detail-identity user-detail-identity"><span><UserRound size={24} aria-hidden="true" /></span>
              <div><strong>{user.email}</strong><p>用户 ID · {user.id}</p></div></div>
            {!membershipOnly && <section className="detail-section" aria-label="账号信息"><h3>账号信息</h3><dl>
              <div><dt>注册时间</dt><dd>{user.registeredAt}</dd></div>
              <div><dt>最后登录</dt><dd>{user.lastLoginAt ?? '—'}</dd></div>
              <div><dt>账号状态</dt><dd><AccountBadge status={user.status} /></dd></div>
              {user.lockedUntil && <div><dt>锁定截止时间</dt><dd>{user.lockedUntil}</dd></div>}
            </dl></section>}
            <section className="detail-section" aria-label="会员信息"><h3><Crown size={17} aria-hidden="true" />会员信息</h3><dl>
              <div><dt>会员状态</dt><dd>{user.membership ? '会员' : '非会员'}</dd></div>
              <div><dt>当前套餐</dt><dd>{membershipPlan(user.membership)}</dd></div>
              <div><dt>到期时间</dt><dd>{membershipExpiry(user.membership)}</dd></div>
            </dl></section>
            {!membershipOnly && <Button variant="ghost" className="user-orders-link" asChild>
              <Link to={`/orders?userId=${encodeURIComponent(user.id)}`}><NotebookText size={17} aria-hidden="true" />查看该用户的全部订单</Link>
            </Button>}
          </>}
      </DetailDrawerContent>
    </Dialog.Portal>
  </Dialog.Root>
}
