import { lazy, Suspense, useRef, useState } from 'react'
import { AccountInformation, UserDetailNavigation, type UserDetailSection } from '@/features/users/user-dialog'
import { UserDetailEmbeddedContext } from '@/features/users/user-detail-components'
import type { User } from '@/features/users/user-types'
import '@/features/users/users.css'
import '@/features/users/user-detail-pages.css'

const UserDetailPages = lazy(() => import('@/features/users/user-detail-pages').then(module => ({ default: module.UserDetailPages })))

export function OrderLinkedUser({ user, onMembershipChanged }: { user: User; onMembershipChanged: () => void }) {
  const [section, setSection] = useState<UserDetailSection>('account')
  const main = useRef<HTMLElement>(null)
  return <div className="order-linked-user">
    <UserDetailNavigation user={user} activeSection={section} onSectionChange={value => { setSection(value); main.current?.scrollTo({ top: 0 }) }}
      onCopy={async value => { try { await navigator.clipboard.writeText(value.id); return true } catch { return false } }} />
    <main ref={main} className="user-detail-main">
      {section === 'account' && <><header className="user-detail-heading"><h2>账号信息</h2><p>查看用户的基本信息与使用情况。</p></header><AccountInformation user={user} /></>}
      <UserDetailEmbeddedContext.Provider value={true}>
        <Suspense fallback={<div className="user-request-state" role="status">正在加载页面…</div>}>
          <UserDetailPages user={user} section={section} onMembershipChanged={onMembershipChanged} />
        </Suspense>
      </UserDetailEmbeddedContext.Provider>
    </main>
  </div>
}
