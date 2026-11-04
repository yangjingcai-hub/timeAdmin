import * as Dialog from '@radix-ui/react-dialog'
import { Ban, Crown, ShieldCheck, UserRound } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { DetailDrawerContent } from '@/components/ui/detail-drawer'
import type { AccountStatus, User } from './mock-users'
import { membershipExpiry, membershipPlan } from './user-display'
import { AccountBadge, type UserAction } from './user-table'

export interface UserDialogState {
  action: UserAction
  user: User
}

interface UserDialogProps {
  selection: UserDialogState | null
  onClose: () => void
  onConfirm: (user: User, status: AccountStatus) => void
  restoreFocus: () => void
}

export function UserDialog({ selection, onClose, onConfirm, restoreFocus }: UserDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirm = selection?.action === 'confirm'
  const restoring = selection?.user.status === 'disabled'
  const membershipOnly = selection?.action === 'membership'
  const accountAction = restoring ? '恢复账号' : '禁用账号'
  const StatusIcon = restoring ? ShieldCheck : Ban

  return (
    <Dialog.Root open={selection !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        {selection && <>
          <Dialog.Overlay className="detail-overlay" />
          {confirm ? (
            <Dialog.Content className="detail-surface user-confirm-dialog" role="alertdialog"
              onOpenAutoFocus={(event) => { event.preventDefault(); cancelRef.current?.focus() }}
              onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus() }}>
              <span className={`user-confirm-icon${restoring ? ' user-confirm-restore' : ''}`}><StatusIcon size={22} aria-hidden="true" /></span>
              <Dialog.Title>确认{accountAction}？</Dialog.Title>
              <Dialog.Description>
                将{restoring ? '恢复' : '禁用'}用户 <strong>{selection.user.email}</strong> 的账号。此操作仅影响当前浏览器中的模拟数据。
              </Dialog.Description>
              <footer className="user-confirm-actions">
                <Dialog.Close asChild><Button ref={cancelRef} type="button" variant="ghost" className="user-cancel-button">取消</Button></Dialog.Close>
                <Button type="button" className={restoring ? 'user-confirm-primary' : 'user-confirm-danger'}
                  onClick={() => onConfirm(selection.user, restoring ? 'active' : 'disabled')}>确认{restoring ? '恢复' : '禁用'}</Button>
              </footer>
            </Dialog.Content>
          ) : (
            <DetailDrawerContent title={membershipOnly ? '会员信息' : '用户详情'}
              description={membershipOnly ? '查看此用户的会员状态与有效期。' : '查看账号、登录记录和会员信息。'} restoreFocus={restoreFocus}>
              <UserDetails user={selection.user} membershipOnly={membershipOnly} />
            </DetailDrawerContent>
          )}
        </>}
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function UserDetails({ user, membershipOnly }: { user: User; membershipOnly: boolean }) {
  return (
    <>
      <div className="detail-identity">
        <span><UserRound size={24} aria-hidden="true" /></span>
        <div><strong>{user.email}</strong><p>用户 ID · {user.id}</p></div>
      </div>
      {!membershipOnly && (
        <section className="detail-section" aria-label="账号信息">
          <h3>账号信息</h3>
          <dl>
            <div><dt>注册时间</dt><dd>{user.registeredAt}</dd></div>
            <div><dt>最后登录</dt><dd>{user.lastLoginAt ?? '—'}</dd></div>
            <div><dt>账号状态</dt><dd><AccountBadge status={user.status} /></dd></div>
          </dl>
        </section>
      )}
      <section className="detail-section" aria-label="会员信息">
        <h3><Crown size={17} aria-hidden="true" />会员信息</h3>
        <dl>
          <div><dt>会员状态</dt><dd>{user.membership ? '会员' : '非会员'}</dd></div>
          <div><dt>当前套餐</dt><dd>{membershipPlan(user.membership)}</dd></div>
          <div><dt>到期时间</dt><dd>{membershipExpiry(user.membership)}</dd></div>
        </dl>
      </section>
    </>
  )
}
