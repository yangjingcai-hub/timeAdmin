export const auditCategories = { users: '用户管理', orders: '订单管理', plans: '套餐管理', settings: '系统设置' } as const
export type AuditCategory = keyof typeof auditCategories
export type AuditStatus = 'success' | 'failure'

export interface AuditChange {
  field: string
  before: string | null
  after: string | null
}

type AuditResult = { status: 'success'; changes: readonly AuditChange[] } | { status: 'failure'; reason: string }

interface AuditEvent {
  category: AuditCategory
  action: string
  target: string
  result: AuditResult
  note?: string
}

export interface AuditLog extends AuditEvent {
  id: string
  occurredAt: string
  administrator: string
  source: string
  ip: string
}

const snapshot = Date.UTC(2026, 10, 4)
const dayMs = 86_400_000

function dateDaysAgo(days: number) {
  return new Date(snapshot - days * dayMs).toISOString().slice(0, 10)
}

export type AuditPeriod = 'week' | 'month' | 'custom'
export interface AuditDateRange { start: string; end: string }

export function presetAuditRange(period: Exclude<AuditPeriod, 'custom'>): AuditDateRange {
  return { start: dateDaysAgo(period === 'week' ? 6 : 29), end: dateDaysAgo(0) }
}

const events = {
  grant: {
    category: 'users', action: '开通测试会员', target: 'user01@example.com',
    result: { status: 'success', changes: [
      { field: '会员状态', before: '普通用户', after: '年会员' },
      { field: '有效期至', before: null, after: '2027-11-04' },
    ] },
    note: '测试账号，用于验证会员功能。',
  },
  price: {
    category: 'plans', action: '修改年会员价格', target: '年会员',
    result: { status: 'success', changes: [
      { field: '套餐价格', before: '¥198', after: '¥168' },
      { field: '有效期', before: '365 天', after: '365 天' },
    ] },
  },
  disable: {
    category: 'users', action: '禁用用户账号', target: 'user09@example.com',
    result: { status: 'success', changes: [{ field: '账号状态', before: '正常', after: '已禁用' }] },
    note: '模拟异常账号处置。',
  },
  failedSettings: {
    category: 'settings', action: '修改系统配置', target: '系统设置 · 默认时区',
    result: { status: 'failure', reason: '系统设置校验失败，提交的默认时区不在支持列表中。' },
  },
  revoke: {
    category: 'users', action: '撤销测试会员', target: 'user03@example.com',
    result: { status: 'success', changes: [
      { field: '会员状态', before: '年会员', after: '普通用户' },
      { field: '有效期至', before: '2027-11-04', after: null },
    ] },
  },
  delist: {
    category: 'plans', action: '下架永久会员', target: '永久会员',
    result: { status: 'success', changes: [{ field: '销售状态', before: '上架中', after: '已下架' }] },
  },
  publish: {
    category: 'plans', action: '上架永久会员', target: '永久会员',
    result: { status: 'success', changes: [{ field: '销售状态', before: '已下架', after: '上架中' }] },
  },
  restore: {
    category: 'users', action: '恢复用户账号', target: 'user08@example.com',
    result: { status: 'success', changes: [{ field: '账号状态', before: '已禁用', after: '正常' }] },
  },
  settings: {
    category: 'settings', action: '修改系统配置', target: '系统设置 · 注册入口',
    result: { status: 'success', changes: [{ field: '开放注册', before: '关闭', after: '开启' }] },
  },
  reviewOrder: {
    category: 'orders', action: '标记订单待复核', target: 'FT202611040328',
    result: { status: 'success', changes: [{ field: '复核状态', before: '未标记', after: '待复核' }] },
    note: '模拟订单人工复核。',
  },
  failedOrder: {
    category: 'orders', action: '核验订单支付状态', target: 'FT202611040327',
    result: { status: 'failure', reason: '订单状态已变更，请重新获取订单信息。' },
  },
} satisfies Record<string, AuditEvent>

const firstPage: readonly [string, AuditEvent][] = [
  ['11-04 18:42:36', events.grant],
  ['11-04 18:35:20', events.price],
  ['11-04 17:56:09', events.disable],
  ['11-04 16:28:47', events.failedSettings],
  ['11-04 15:12:33', events.revoke],
  ['11-03 20:11:06', events.delist],
  ['11-03 19:47:15', events.publish],
  ['11-03 14:22:08', events.restore],
  ['11-02 11:36:27', events.settings],
  ['11-02 10:20:11', { ...events.grant, target: 'user12@example.com' }],
]

const actors = [
  { administrator: 'admin', ip: '192.0.2.100' },
  { administrator: 'ops_admin', ip: '192.0.2.101' },
  { administrator: 'support_admin', ip: '198.51.100.18' },
]
const templates = Object.values(events)

function createLog(event: AuditEvent, occurredAt: string, index: number, actor = actors[0]): AuditLog {
  return { ...event, ...actor, id: `audit-${index + 1}`, occurredAt, source: `后台 · ${auditCategories[event.category]}` }
}

function generateLogs(count: number, startDay: number, endDay: number, offset: number) {
  return Array.from({ length: count }, (_, index) => {
    const day = startDay + Math.floor(index * (endDay - startDay + 1) / count)
    const minute = String(59 - index % 60).padStart(2, '0')
    const event = templates[index % templates.length]
    const target = event.target.endsWith('@example.com') ? `user${index + offset + 20}@example.com` : event.target
    return createLog({ ...event, target }, `${dateDaysAgo(day)} 09:${minute}:00`, index + offset, actors[index % actors.length])
  })
}

export const mockAuditLogs: readonly AuditLog[] = [
  ...firstPage.map(([time, event], index) => createLog(event, `2026-${time}`, index)),
  ...generateLogs(118, 3, 6, 10),
  ...generateLogs(216, 7, 29, 128),
].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))

export interface AuditFilters {
  query: string
  category: AuditCategory | 'all'
  status: AuditStatus | 'all'
}

export const defaultAuditFilters: AuditFilters = { query: '', category: 'all', status: 'all' }

export function filterAuditLogs(logs: readonly AuditLog[], filters: AuditFilters, dates: AuditDateRange) {
  const query = filters.query.trim().toLowerCase()
  return logs.filter((log) => {
    const date = log.occurredAt.slice(0, 10)
    if (date < dates.start || date > dates.end) return false
    if (filters.category !== 'all' && log.category !== filters.category) return false
    if (filters.status !== 'all' && log.result.status !== filters.status) return false
    return !query || [log.administrator, log.target, log.action].some((value) => value.toLowerCase().includes(query))
  })
}
