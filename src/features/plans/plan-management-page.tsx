import { CalendarCheck, CheckCircle2, CircleMinus, Clock3, Crown, Gem, Pencil, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPlanDuration, formatPlanPrice, formatPlanUpdatedAt, planDetails, saleStatus, toPlan, type PlanConfig, type PlanResponse } from './plan-config'
import { useAdminAuth } from '@/features/auth/admin-auth'
import { ApiError } from '@/lib/api'
import { PlanEditor } from './plan-editor'
import { readTrialRule, storeTrialRule, trialClaimLimit, type TrialRule } from './trial-rule'
import { TrialRuleEditor } from './trial-rule-editor'
import './plans.css'

const planIcons = { monthly: CalendarCheck, annual: Crown, lifetime: Gem }

export function PlanManagementPage() {
  const { request } = useAdminAuth()
  const [plans, setPlans] = useState<PlanConfig[] | null>(null)
  const [failure, setFailure] = useState('')
  const [reload, setReload] = useState(0)
  const [trialRule, setTrialRule] = useState(readTrialRule)
  const [editingTrial, setEditingTrial] = useState(false)
  const [editing, setEditing] = useState<PlanConfig | null>(null)
  const [notice, setNotice] = useState('')
  const editTrigger = useRef<HTMLButtonElement>(null)
  const trialTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setFailure('')
    request<PlanResponse[]>('/api/v1/admin/membership-plans', { signal: controller.signal }).then(values => {
      if (!controller.signal.aborted) setPlans(['monthly', 'annual', 'lifetime'].map(id => toPlan(values.find(plan => plan.id === id)!)))
    }).catch(() => { if (!controller.signal.aborted) { setPlans(null); setFailure('套餐加载失败，请重试。') } })
    return () => controller.abort()
  }, [request, reload])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  async function savePlan(plan: PlanConfig) {
    let saved: PlanResponse
    try { saved = await request<PlanResponse>(`/api/v1/admin/membership-plans/${plan.id}`, {
      method: 'PUT', headers: { 'X-FocusTime-Admin': '1' }, body: JSON.stringify({ amountFen: plan.priceCents,
        durationDays: plan.durationDays, available: plan.available, recommended: plan.recommended, expectedVersion: plan.version }),
    }) } catch (error) {
      throw new Error(error instanceof ApiError && error.code === 'plan_version_conflict'
        ? '套餐已被其他管理员更新，请关闭弹窗并刷新列表后重试。' : '套餐保存失败，请检查连接后重试。')
    }
    setPlans(current => current?.map(value => value.id === saved.id ? toPlan(saved) : value) ?? null)
    setEditing(null)
    setNotice(`${planDetails[plan.id].name}已保存`)
  }

  function saveTrialRule(rule: TrialRule) {
    setTrialRule(rule)
    storeTrialRule(rule)
    setEditingTrial(false)
    setNotice('体验规则已保存')
  }

  return (
    <>
      <PageHeader title="套餐管理" description="管理会员套餐的价格、有效期及销售状态。" />
      <div className="plans-page">
        <Card className="plan-section" aria-labelledby="paid-plans-title">
          <header className="plan-section-header"><h2 id="paid-plans-title">付费套餐</h2>
            <Button variant="ghost" onClick={() => setReload(value => value + 1)}>刷新套餐</Button></header>
          {(!plans || failure) && <p role={failure ? 'alert' : 'status'}>{failure || '正在读取套餐…'}</p>}
          <Table className="plan-table" aria-labelledby="paid-plans-title">
            <colgroup><col className="plan-column-name" /><col /><col /><col /><col className="plan-column-updated" /><col className="plan-column-actions" /></colgroup>
            <TableHeader><TableRow>
              <TableHead>套餐名称</TableHead><TableHead>价格</TableHead><TableHead>有效期</TableHead>
              <TableHead>状态</TableHead><TableHead>更新时间</TableHead><TableHead>操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {plans?.map((plan) => {
                const { name } = planDetails[plan.id]
                const Icon = planIcons[plan.id]
                const StatusIcon = plan.available ? CheckCircle2 : CircleMinus
                return (
                  <TableRow key={plan.id}>
                    <TableCell><div className="plan-table-name">
                      <span className={`plan-icon plan-icon-${plan.id === 'annual' ? 'yearly' : plan.id}`}><Icon size={21} strokeWidth={2} aria-hidden="true" /></span>
                      <span>{name}</span>
                    </div></TableCell>
                    <TableCell className="plan-table-price">{formatPlanPrice(plan.priceCents)}</TableCell>
                    <TableCell>{formatPlanDuration(plan.durationDays)}{plan.durationDays === 365 ? '（1 年）' : ''}</TableCell>
                    <TableCell><Badge className={`plan-sale-badge ${plan.available ? 'plan-on-sale' : 'plan-off-sale'}`}>
                      <StatusIcon size={13} aria-hidden="true" />{saleStatus(plan.available)}
                    </Badge></TableCell>
                    <TableCell className="plan-table-updated">{formatPlanUpdatedAt(plan.updatedAtUtc)}</TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" className="plan-edit-button" aria-label={`编辑套餐 · ${name}`}
                        onClick={(event) => { editTrigger.current = event.currentTarget; setNotice(''); setEditing(plan) }}>
                        <Pencil size={16} aria-hidden="true" />编辑
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
        <Card className="plan-section trial-rule-section" aria-labelledby="trial-rule-title">
          <header className="plan-section-header">
            <h2 id="trial-rule-title">免费体验规则</h2>
            <Button ref={trialTrigger} type="button" variant="ghost" className="plan-edit-button"
              onClick={() => { setNotice(''); setEditingTrial(true) }}>
              <Pencil size={16} aria-hidden="true" />编辑规则
            </Button>
          </header>
          <dl className="trial-rule-summary">
            <div><span className="trial-rule-icon trial-rule-duration"><Clock3 size={27} aria-hidden="true" /></span>
              <div><dt>体验时长</dt><dd>{trialRule.durationDays} 天</dd></div>
            </div>
            <div><span className="trial-rule-icon trial-rule-limit"><UserRound size={27} aria-hidden="true" /></span>
              <div><dt>领取限制</dt><dd>{trialClaimLimit}</dd></div>
            </div>
          </dl>
        </Card>
      </div>

      <div role="status" className={notice ? 'plan-notice' : 'sr-only'}>
        {notice && <><CheckCircle2 size={18} aria-hidden="true" />{notice}</>}
      </div>
      {editing && <PlanEditor key={editing.id} plan={editing} onClose={() => setEditing(null)} onConfirm={savePlan} restoreFocus={() => editTrigger.current?.focus()} />}
      {editingTrial && <TrialRuleEditor rule={trialRule} onClose={() => setEditingTrial(false)} onConfirm={saveTrialRule} restoreFocus={() => trialTrigger.current?.focus()} />}
    </>
  )
}
