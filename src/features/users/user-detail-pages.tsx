import { UserDevicesPage } from './user-devices-page'
import { UserLogsPage } from './user-logs-page'
import { UserMembershipPage } from './user-membership-page'
import type { User } from './user-types'
import './user-detail-pages.css'

export function UserDetailPages({ user, section, onMembershipChanged }: { user: User; section: 'account' | 'membership' | 'devices' | 'logs'; onMembershipChanged: () => void }) {
  if (section === 'membership') return <UserMembershipPage user={user} onMembershipChanged={onMembershipChanged} />
  if (section === 'devices') return <UserDevicesPage user={user} />
  if (section === 'logs') return <UserLogsPage userId={user.id} />
  return null
}
