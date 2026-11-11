import { Activity, Bell, Box, ClipboardList, House, NotebookText, UserRound } from 'lucide-react'
import { useLayoutEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { NotificationPoptip } from '@/features/notifications/notification-poptip'
import { NotificationProvider } from '@/features/notifications/notification-provider'
import { AdminAccountMenu } from './admin-account-menu'
import './admin-layout.css'

export function AdminLayout() {
  const { pathname } = useLocation()

  useLayoutEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="专注时光管理后台首页">
          <img src="/brand.svg" width="44" height="44" alt="" />
          <span className="brand-copy"><strong>专注时光</strong><span>管理后台</span></span>
        </NavLink>
        <nav className="navigation" aria-label="管理后台导航">
          <ul>
            <li><NavLink end to="/" className={navLinkClass} title="数据概览"><House aria-hidden="true" /><span>数据概览</span></NavLink></li>
            <li><NavLink end to="/users" className={navLinkClass} title="用户管理"><UserRound aria-hidden="true" /><span>用户管理</span></NavLink></li>
            <li><NavLink end to="/orders" className={navLinkClass} title="订单管理"><NotebookText aria-hidden="true" /><span>订单管理</span></NavLink></li>
            <li><NavLink end to="/plans" className={navLinkClass} title="套餐管理"><Box aria-hidden="true" /><span>套餐管理</span></NavLink></li>
            <li><NavLink end to="/monitor" className={navLinkClass} title="系统监控"><Activity aria-hidden="true" /><span>系统监控</span></NavLink></li>
            <li><NavLink end to="/audit" className={navLinkClass} title="操作日志"><ClipboardList aria-hidden="true" /><span>操作日志</span></NavLink></li>
            <li><NavLink end to="/notifications" className={navLinkClass} title="通知中心"><Bell aria-hidden="true" /><span>通知中心</span></NavLink></li>
          </ul>
        </nav>
        <svg aria-hidden="true" className="sidebar-hills" viewBox="0 0 240 178" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hill-back" x2="0" y2="1"><stop stopColor="#fff2eb"/><stop offset="1" stopColor="#ffe6d4" stopOpacity=".34"/></linearGradient>
            <linearGradient id="hill-front" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ffd7b7"/><stop offset="1" stopColor="#fff1e8" stopOpacity=".28"/></linearGradient>
          </defs>
          <path d="M0 37C67-4 130 45 240 70V178H0Z" fill="url(#hill-back)"/>
          <path d="M0 130c23-19 64-31 106-53C153 53 196 13 240 0v178H0Z" fill="url(#hill-front)"/>
        </svg>
      </aside>
      <div className="workspace">
        <NotificationProvider>
          <AdminHeader />
          <main className="admin-container admin-content"><Outlet /></main>
        </NotificationProvider>
      </div>
    </div>
  )
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-item nav-item-active' : 'nav-item'
}

function AdminHeader() {
  return (
    <header className="admin-topbar" aria-label="后台顶部导航">
      <div className="admin-container admin-topbar-inner">
        <NotificationPoptip />
        <span className="admin-topbar-separator" aria-hidden="true" />
        <AdminAccountMenu />
      </div>
    </header>
  )
}
