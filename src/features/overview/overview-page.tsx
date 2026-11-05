import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { GrowthChart } from './growth-chart'
import { MembershipChart } from './membership-chart'
import { RecentOrders, RecentUsers } from './recent-activity'
import { StatCards } from './stat-cards'
import { overviewPath, type OverviewData, type TrendRange } from './overview-api'

export function OverviewPage() {
  const { request } = useAdminAuth()
  const [range, setRange] = useState<TrendRange>(7)
  const [result, setResult] = useState<{ range: TrendRange; data: OverviewData } | null>(null)
  const [failure, setFailure] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    request<OverviewData>(overviewPath(range), { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setResult({ range, data })
    }).catch(() => {
      if (controller.signal.aborted) return
      setResult(null)
      setFailure('数据获取失败，请检查后端服务后重试。')
    })
    return () => controller.abort()
  }, [range, request, attempt])

  const data = result?.data
  const pending = !failure && result?.range !== range
  const unavailable = failure || '正在加载数据…'

  return (
    <>
      <PageHeader title="数据概览" description="本页展示用户、会员、订单及系统运行状态的整体情况" />
      <div className="overview-content">
        {failure && <div role="alert" className="overview-feedback">{failure}
          <Button type="button" variant="ghost" onClick={() => { setFailure(''); setAttempt((value) => value + 1) }}>重试</Button>
        </div>}
        <StatCards summary={data?.summary} trend={data?.trend} />
        <div className="chart-grid">
          <GrowthChart range={range} onRange={(days) => { if (days !== range) { setFailure(''); setRange(days) } }}
            data={result?.range === range ? data?.trend : undefined} message={pending ? '正在加载趋势…' : unavailable} />
          <MembershipChart membership={data?.membership} activeMembers={data?.summary.activeMembers} message={unavailable} />
        </div>
        <div className="activity-grid"><RecentOrders orders={data?.recentOrders} message={unavailable} /><RecentUsers users={data?.recentUsers} message={unavailable} /></div>
      </div>
    </>
  )
}
