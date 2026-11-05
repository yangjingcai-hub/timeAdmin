import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AuditLogPage } from '@/features/audit/audit-log-page'
import { AdminAuthProvider, RequireAdministrator } from '@/features/auth/admin-auth'
import { LoginPage } from '@/features/auth/login-page'
import { SystemMonitorPage } from '@/features/monitor/system-monitor-page'
import { OrderManagementPage } from '@/features/orders/order-management-page'
import { OverviewPage } from '@/features/overview/overview-page'
import { PlanManagementPage } from '@/features/plans/plan-management-page'
import { UserManagementPage } from '@/features/users/user-management-page'
import '@/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAdministrator />}>
            <Route element={<AdminLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="orders" element={<OrderManagementPage />} />
              <Route path="plans" element={<PlanManagementPage />} />
              <Route path="monitor" element={<SystemMonitorPage />} />
              <Route path="audit" element={<AuditLogPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
