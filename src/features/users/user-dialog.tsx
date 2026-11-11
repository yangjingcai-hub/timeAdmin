import * as Dialog from '@radix-ui/react-dialog'
import {
  ChartNoAxesColumn, Check, CircleCheck, Clock3, Copy, Crown,
  History, Monitor, Shield, Target, UserRound, X, type LucideIcon,
} from 'lucide-react'
import { lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AccountBadge } from './user-table'
import { detailPath, formatDetailTime, useUserDetailRequest, type UserAccountData } from './user-detail-api'
import { UserDetailRequestState } from './user-detail-components'
import { toUser, type AdminUserResponse } from './user-api'
import type { User } from './user-types'

const UserDetailPages = lazy(() => import('./user-detail-pages').then(module => ({ default: module.UserDetailPages })))

const sections = [
  { id: 'account', label: '账号信息', description: '查看用户的基本信息与使用情况', icon: UserRound },
  { id: 'membership', label: '会员与订单', description: '会员资格及购买记录', icon: Crown },
  { id: 'devices', label: '登录设备', description: '设备与登录会话', icon: Monitor },
  { id: 'logs', label: '操作日志', description: '管理员的历史操作', icon: History },
] as const
export type UserDetailSection = typeof sections[number]['id']

// Shared by user management and the order's in-place linked-account view.
export function UserDetailNavigation({ user, activeSection, onSectionChange, onCopy }: {
  user: User | null; activeSection: UserDetailSection; onSectionChange: (section: UserDetailSection) => void
  onCopy: (user: User) => Promise<boolean>
}) {
  const [copied, setCopied] = useState(false)
  return <aside className="user-detail-sidebar">
    <div className="user-profile">
      <span className="user-profile-avatar"><UserRound size={43} strokeWidth={1.6} aria-hidden="true" /></span>
      <strong>{user?.email ?? '用户详情'}</strong>
      {user && <div className="user-profile-id"><span>用户ID：</span><span title={user.id}>{user.id}</span>
        <button type="button" aria-label="复制用户ID" title={copied ? '已复制' : '复制用户ID'} onClick={async () => { setCopied(await onCopy(user)) }}>
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </button>
      </div>}
    </div>
    <nav className="user-detail-nav" aria-label="用户详情导航">
      {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button"
        aria-current={activeSection === id ? 'page' : undefined} onClick={() => onSectionChange(id)}>
        <Icon size={25} strokeWidth={1.7} aria-hidden="true" /><strong>{label}</strong>
      </button>)}
    </nav>
  </aside>
}

function DetailCard({ title, icon: Icon, children, className = '', badges }: {
  title: string; icon: LucideIcon; children: ReactNode; className?: string; badges?: ReactNode
}) {
  return <section className={`user-info-card ${className}`} aria-label={title}>
    <header><span className="user-info-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
      <h3>{title}</h3>{badges && <div className="user-info-badges">{badges}</div>}
    </header>
    {children}
  </section>
}

export function AccountInformation({ user }: { user: User }) {
  const account = useUserDetailRequest<UserAccountData>(detailPath(user.id, 'account'), user.id)
  if (!account.data) return <UserDetailRequestState request={account} />
  return <AccountInformationContent user={user} data={account.data} />
}

export function AccountInformationContent({ user, data }: { user: User; data: UserAccountData }) {
  const { stats } = data
  const metrics = [
    { label: '任务数量', value: stats.totalTasks ?? stats.completedTasks, unit: '项', icon: CircleCheck, tone: 'green', note: stats.totalTasks === null ? '已同步专注记录中的去重完成任务数' : undefined },
    { label: '专注记录', value: stats.records, unit: '条', icon: Clock3, tone: 'blue' },
    { label: '屏蔽规则', value: stats.rules, unit: '条', icon: Shield, tone: 'purple' },
    { label: '目标数量', value: stats.goals, unit: '个', icon: Target, tone: 'orange' },
  ]

  return <div className="user-account-grid">
    <DetailCard title="账号概况" icon={UserRound} badges={<>
      <AccountBadge status={user.status} detailed />
      {user.membership
        ? <span className="user-badge user-member user-detail-badge"><Crown size={16} aria-hidden="true" />会员</span>
        : <span className="user-badge user-nonmember user-detail-badge">非会员</span>}
    </>}>
      <dl className="user-info-rows">
        <div><dt>邮箱 / 手机号</dt><dd className="user-info-email">{user.email}</dd></div>
        <div><dt>注册时间</dt><dd>{user.registeredAt}</dd></div>
        <div><dt>最后登录</dt><dd>{user.lastLoginAt ?? '—'}</dd></div>
      </dl>
    </DetailCard>
    <DetailCard title="使用数据" icon={ChartNoAxesColumn} className="user-usage-card">
      <dl className="user-metric-rows">
        {metrics.map(({ label, value, unit, icon: Icon, tone, note }) => <div className={`user-metric user-metric-${tone}`} key={label} title={note}>
          <dt><span className="user-metric-icon"><Icon size={27} strokeWidth={1.9} aria-hidden="true" /></span>{label}</dt>
          <dd>{value == null ? '—' : <>{value} <small>{unit}</small></>}</dd>
        </div>)}
      </dl>
      <dl className="user-last-sync"><div><dt>最近成功同步</dt><dd>{stats.lastSyncAtUtc ? formatDetailTime(stats.lastSyncAtUtc) : '暂无记录'}</dd></div></dl>
    </DetailCard>
  </div>
}

export function UserDialog({ open, user: initialUser, userId, onClose, restoreFocus, onCopy, onMembershipChanged }: {
  open: boolean; user: User | null; userId: string | null
  onClose: () => void; restoreFocus: () => void; onCopy: (user: User) => Promise<boolean>
  onMembershipChanged: () => void
}) {
  const basic = useUserDetailRequest<AdminUserResponse>(open && userId ? `/api/v1/admin/users/${encodeURIComponent(userId)}` : null, userId, 'id')
  const user = basic.data ? toUser(basic.data) : initialUser?.id === userId ? initialUser : null
  const [activeSection, setActiveSection] = useState<typeof sections[number]['id']>('account')
  const closeButton = useRef<HTMLButtonElement>(null)
  const mainContent = useRef<HTMLElement>(null)
  const section = sections.find(item => item.id === activeSection)!

  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="user-modal-overlay" />
      <Dialog.Content className="user-detail-modal" onCloseAutoFocus={event => { event.preventDefault(); restoreFocus() }}
        onOpenAutoFocus={event => { event.preventDefault(); closeButton.current?.focus() }}>
        <Dialog.Close asChild><Button ref={closeButton} type="button" variant="ghost" size="icon" aria-label="关闭用户详情" className="user-modal-close"><X size={20} aria-hidden="true" /></Button></Dialog.Close>
        <UserDetailNavigation user={user} activeSection={activeSection} onCopy={onCopy}
          onSectionChange={id => { setActiveSection(id); mainContent.current?.scrollTo({ top: 0 }) }} />
        <main ref={mainContent} className="user-detail-main">
          {(activeSection === 'account' || !basic.data) && <header className="user-detail-heading">
            <Dialog.Title>{section.label}</Dialog.Title>
            <Dialog.Description>{section.description}。</Dialog.Description>
          </header>}
          {!basic.data || !user ? <UserDetailRequestState request={basic} />
            : <>
              {activeSection === 'account' && <AccountInformation user={user} />}
              <Suspense fallback={activeSection === 'account' ? null : <>
                <header className="user-detail-heading"><Dialog.Title>{section.label}</Dialog.Title><Dialog.Description>{section.description}。</Dialog.Description></header>
                <div className="user-request-state" role="status">正在加载页面…</div>
              </>}>
                <UserDetailPages key={user.id} user={user} section={activeSection} onMembershipChanged={() => {
                  basic.retry(); onMembershipChanged(); window.requestAnimationFrame(() => closeButton.current?.focus())
                }} />
              </Suspense>
            </>}
        </main>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
