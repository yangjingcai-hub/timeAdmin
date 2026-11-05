import { apiRequest } from '@/lib/api'

export interface AdminSession {
  email: string
  expiresAtUtc: string
}

export interface ChangeAdminPassword {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const sessionPath = '/api/v1/admin/session'
const mutationHeaders = { 'X-FocusTime-Admin': '1' }

function browserInstallationId() {
  const key = 'focustime-admin-installation'
  const id = crypto.randomUUID()
  try {
    const stored = localStorage.getItem(key)
    if (stored && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(stored)) return stored
    localStorage.setItem(key, id)
  } catch {
    // The installation identifier is optional browser metadata.
  }
  return id
}

export function getAdminSession(signal: AbortSignal) {
  return apiRequest<AdminSession>(sessionPath, { signal })
}

export function signInAdmin(email: string, password: string) {
  return apiRequest<AdminSession>(sessionPath, {
    method: 'POST',
    headers: mutationHeaders,
    body: JSON.stringify({
      email, password,
      device: { installationId: browserInstallationId(), name: 'FocusTime 管理后台', operatingSystem: 'Web', clientVersion: '1.0' },
    }),
  })
}

export function signOutAdmin() {
  return apiRequest<void>(sessionPath, { method: 'DELETE', headers: mutationHeaders })
}

export function changeAdminPassword(values: ChangeAdminPassword) {
  return apiRequest<void>('/api/v1/admin/password', {
    method: 'POST', headers: mutationHeaders, body: JSON.stringify(values),
  })
}
