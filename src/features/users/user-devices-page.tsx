import { Info, Laptop, LogOut, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserDetailRequestState, UserDetailStatus, UserSubpageHeading } from './user-detail-components'
import { detailPath, formatDetailTime, useUserDetailRequest, type UserSessionsData } from './user-detail-api'
import { UserActionConfirmation } from './user-action-confirmation'
import type { User } from './user-types'

function DeviceTime({ value }: { value: string }) {
  const [date, time] = formatDetailTime(value).split(' ')
  return <time className="user-device-time" dateTime={value}><span>{date}</span><span>{time}</span></time>
}
export function UserDevicesPage({ user }: { user: User }) {
  const userId = user.id
  const sessions = useUserDetailRequest<UserSessionsData>(detailPath(userId, 'sessions'), userId)
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState('')
  const hasSessions = sessions.data?.items.some(session => session.status === 'valid' || session.status === 'refresh-required')
  const statusLabels = { valid: '会话有效', 'refresh-required': '待刷新', expired: '已过期', revoked: '已退出' }
  return <div className="user-detail-subpage user-devices-page">
    <UserSubpageHeading title="登录设备" icon={Monitor} description="查看该用户的登录设备与服务器会话记录。" action={
      <Button type="button" variant="ghost" className="user-subpage-button" disabled={!hasSessions}
        onClick={() => { setNotice(''); setConfirming(true) }}><LogOut size={17} aria-hidden="true" />强制退出所有设备</Button>
    } />
    {!sessions.data ? <UserDetailRequestState request={sessions} /> : <div className="user-subpage-table-frame user-devices-frame">
      <Table className="user-subpage-table user-devices-table" aria-label="用户登录设备">
        <TableHeader><TableRow>{['设备名称', '设备类型', '系统与版本', '登录地点（IP）', '首次登录', '最后活跃', '登录状态', '操作'].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{sessions.data.items.map(device => {
          const os = device.operatingSystem.toLowerCase()
          const mobile = /ios|android|iphone|ipad/.test(os)
          const desktop = /windows|mac|linux/.test(os)
          const DeviceIcon = mobile ? Smartphone : /mac/.test(os) ? Laptop : Monitor
          return <TableRow key={device.id}>
            <TableCell><div className="user-device-name"><DeviceIcon size={21} strokeWidth={1.8} aria-hidden="true" /><strong>{device.name || '—'}</strong></div></TableCell>
            <TableCell>{mobile || desktop ? <UserDetailStatus tone="blue">{mobile ? '移动端' : '桌面端'}</UserDetailStatus> : '—'}</TableCell>
            <TableCell>{device.operatingSystem || '—'}{device.clientVersion && <span className="user-device-client">客户端 {device.clientVersion}</span>}</TableCell>
            <TableCell><span className="user-device-location">{device.location || '—'}{device.ip && <span>({device.ip})</span>}</span></TableCell>
            <TableCell><DeviceTime value={device.firstLoginAtUtc} /></TableCell><TableCell><DeviceTime value={device.lastActiveAtUtc} /></TableCell>
            <TableCell><UserDetailStatus tone={device.status === 'valid' ? 'green' : device.status === 'refresh-required' ? 'orange' : 'neutral'}>{statusLabels[device.status] ?? device.status}</UserDetailStatus></TableCell>
            <TableCell><button type="button" className="user-subpage-link" disabled title="暂未开放退出操作">退出登录</button></TableCell>
          </TableRow>
        })}{!sessions.data.items.length && <TableRow><TableCell colSpan={8} className="user-detail-empty-cell">暂无登录会话</TableCell></TableRow>}</TableBody>
      </Table>
    </div>}
    <p className="user-device-hint"><Info size={17} aria-hidden="true" /><span>会话有效不代表设备当前在线。</span></p>
    {notice && <p className="user-device-hint" role="status">{notice}</p>}
    {confirming && <UserActionConfirmation user={user} action="sign-out" onClose={() => setConfirming(false)}
      onSuccess={() => { setConfirming(false); sessions.retry(); setNotice('已强制退出所有设备。') }} />}
  </div>
}
