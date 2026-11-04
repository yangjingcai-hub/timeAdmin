import { PageHeader } from '@/components/layout/page-header'
import { GrowthChart } from './growth-chart'
import { MembershipChart } from './membership-chart'
import { RecentOrders, RecentUsers } from './recent-activity'
import { StatCards } from './stat-cards'

export function OverviewPage() {
  return (
    <>
      <PageHeader title="数据概览" description="本页展示用户、会员、订单及系统运行状态的整体情况" />
      <div className="overview-content">
        <StatCards />
        <div className="chart-grid"><GrowthChart /><MembershipChart /></div>
        <div className="activity-grid"><RecentOrders /><RecentUsers /></div>
      </div>
    </>
  )
}
