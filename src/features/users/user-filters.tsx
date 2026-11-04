import { useState, type Ref } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListSearch, ListSelect } from '@/components/ui/list-controls'
import { registrationRanges, type RegistrationRange } from './mock-users'
import type { UserFilterValues } from './user-list-model'

interface UserFiltersProps {
  values: UserFilterValues
  onChange: (values: UserFilterValues) => void
  searchRef: Ref<HTMLInputElement>
}

export function UserFilters({ values, onChange, searchRef }: UserFiltersProps) {
  const [exportNotice, setExportNotice] = useState(false)

  return (
    <div className="user-filters" role="group" aria-label="搜索与筛选">
      <ListSearch ref={searchRef} aria-label="搜索用户ID或邮箱" placeholder="搜索用户ID / 邮箱" value={values.query}
        onChange={(event) => onChange({ ...values, query: event.target.value })} />
      <ListSelect label="会员状态" value={values.membership}
        onChange={(event) => onChange({ ...values, membership: event.target.value as UserFilterValues['membership'] })}>
        <option value="all">全部</option><option value="member">会员</option><option value="nonMember">非会员</option>
      </ListSelect>
      <ListSelect label="账号状态" value={values.account}
        onChange={(event) => onChange({ ...values, account: event.target.value as UserFilterValues['account'] })}>
        <option value="all">全部</option><option value="active">正常</option><option value="disabled">已禁用</option>
      </ListSelect>
      <ListSelect label="注册时间" className="registration-select" value={values.registration}
        onChange={(event) => onChange({ ...values, registration: event.target.value as RegistrationRange })}>
        {Object.entries(registrationRanges).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
      </ListSelect>
      <div className="user-export" onBlur={() => setExportNotice(false)}>
        <Button type="button" variant="ghost" className="list-export-button user-export-button" onClick={() => setExportNotice(!exportNotice)}>
          <Download size={17} aria-hidden="true" />导出用户
        </Button>
        <span className={exportNotice ? 'user-export-note' : 'sr-only'} role="status">{exportNotice && '导出功能暂未开放'}</span>
      </div>
    </div>
  )
}
