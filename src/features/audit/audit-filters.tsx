import { CalendarDays, CircleCheck, Layers3 } from 'lucide-react'
import { useState, type FormEvent, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { ListSearch, ListSelect } from '@/components/ui/list-controls'
import { auditCategories, type AuditDateRange, type AuditFilters as FilterValues, type AuditPeriod } from './audit-data'

interface AuditFiltersProps {
  values: FilterValues
  onChange: (filters: FilterValues) => void
  searchRef: Ref<HTMLInputElement>
  period: AuditPeriod
  onPeriodChange: (period: AuditPeriod) => void
  dates: AuditDateRange
  onDatesChange: (dates: AuditDateRange) => void
}

export function AuditFilters({ values, onChange, searchRef, period, onPeriodChange, dates, onDatesChange }: AuditFiltersProps) {
  return (
    <div className="audit-filters" role="group" aria-label="日志搜索与筛选">
      <ListSearch ref={searchRef} aria-label="搜索管理员、用户邮箱或操作内容" placeholder="搜索管理员、用户邮箱或操作内容（如：开通会员、修改价格）"
        value={values.query} onChange={(event) => onChange({ ...values, query: event.target.value })} />
      <div className="audit-filter-row">
        <ListSelect label="操作类型" icon={Layers3} className="audit-select" value={values.category}
          onChange={(event) => onChange({ ...values, category: event.target.value as FilterValues['category'] })}>
          <option value="all">全部类型</option>
          {Object.entries(auditCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </ListSelect>
        <ListSelect label="操作结果" icon={CircleCheck} className="audit-select" value={values.status}
          onChange={(event) => onChange({ ...values, status: event.target.value as FilterValues['status'] })}>
          <option value="all">全部结果</option><option value="success">成功</option><option value="failure">失败</option>
        </ListSelect>
        <ListSelect label="时间范围" icon={CalendarDays} className="audit-select" value={period}
          onChange={(event) => onPeriodChange(event.target.value as AuditPeriod)}>
          <option value="week">最近 7 天</option><option value="month">最近 30 天</option><option value="custom">自定义时间</option>
        </ListSelect>
      </div>
      {period === 'custom' && <CustomAuditDates dates={dates} onApply={onDatesChange} />}
    </div>
  )
}

function CustomAuditDates({ dates, onApply }: { dates: AuditDateRange; onApply: (dates: AuditDateRange) => void }) {
  const [error, setError] = useState('')

  function applyDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const start = String(values.get('start') ?? '')
    const end = String(values.get('end') ?? '')
    if (!start || !end) {
      setError('请选择开始日期和结束日期。')
    } else if (start > end) {
      setError('开始日期不能晚于结束日期。')
    } else {
      setError('')
      onApply({ start, end })
    }
  }

  return (
    <form className="audit-date-range" aria-label="自定义时间范围" noValidate onSubmit={applyDates}>
      <label>开始日期<input type="date" name="start" defaultValue={dates.start} onChange={() => setError('')}
        aria-invalid={Boolean(error)} aria-describedby={error ? 'audit-date-error' : undefined} /></label>
      <label>结束日期<input type="date" name="end" defaultValue={dates.end} onChange={() => setError('')}
        aria-invalid={Boolean(error)} aria-describedby={error ? 'audit-date-error' : undefined} /></label>
      <Button type="submit" className="audit-date-apply">应用</Button>
      {error && <p className="audit-date-error" id="audit-date-error" role="alert">{error}</p>}
    </form>
  )
}
