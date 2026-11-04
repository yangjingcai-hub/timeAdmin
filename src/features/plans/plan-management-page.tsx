import { CalendarCheck, CheckCircle2, Crown, Gem, Info, Pencil, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPlanDuration, formatPlanPrice, planDetails, readPlans, saleStatus, storePlans, type PlanConfig } from './plan-config'
import { PlanEditor } from './plan-editor'
import './plans.css'

const planIcons = { monthly: CalendarCheck, yearly: Crown, lifetime: Gem }

const notes = [
  { title: '价格调整', description: '仅影响新购买订单', icon: ShieldCheck },
  { title: '有效期', description: '表示会员权益的使用时长', icon: CalendarCheck },
  { title: '销售状态', description: '下架后无法新购，不影响已有会员', icon: ShoppingCart },
]

export function PlanManagementPage() {
  const [plans, setPlans] = useState(readPlans)
  const [editing, setEditing] = useState<PlanConfig | null>(null)
  const [notice, setNotice] = useState('')
  const editTrigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function savePlan(plan: PlanConfig) {
    const updated = plans.map((current) => current.id === plan.id ? plan : current)
    setPlans(updated)
    storePlans(updated)
    setEditing(null)
    setNotice(`${planDetails[plan.id].name}已保存`)
  }

  return (
    <>
      <PageHeader title="套餐管理" description="管理会员套餐的价格、有效期及销售状态。" />
      <div>
        <section className="plan-grid" aria-label="会员套餐">
          {plans.map((plan) => {
            const { name, description } = planDetails[plan.id]
            const Icon = planIcons[plan.id]
            return (
              <Card key={plan.id} aria-labelledby={`plan-title-${plan.id}`} className="plan-card" data-recommended={plan.recommended}>
                <div className="plan-card-top">
                  <span className={`plan-icon plan-icon-${plan.id}`}><Icon size={31} strokeWidth={2.1} aria-hidden="true" /></span>
                  <div className="plan-badges">
                    {plan.recommended && <Badge className="plan-recommended">推荐</Badge>}
                    <Badge className={plan.available ? 'plan-on-sale' : 'plan-off-sale'}>{saleStatus(plan.available)}</Badge>
                  </div>
                </div>
                <h2 id={`plan-title-${plan.id}`}>{name}</h2>
                <p className="plan-description">{description}</p>
                <p className="plan-price">{formatPlanPrice(plan.priceCents)}</p>
                <p className="plan-duration">有效期：{formatPlanDuration(plan.durationDays)}{plan.durationDays === 365 ? '（1 年）' : ''}</p>
                <Button type="button" variant="ghost" className="plan-edit-button" aria-label={`编辑套餐 · ${name}`}
                  onClick={(event) => { editTrigger.current = event.currentTarget; setNotice(''); setEditing(plan) }}>
                  <Pencil size={17} aria-hidden="true" />编辑套餐
                </Button>
              </Card>
            )
          })}
        </section>

        <section className="plan-notes" aria-labelledby="plan-notes-title">
          <h2 id="plan-notes-title"><Info size={22} aria-hidden="true" />套餐说明</h2>
          <ul>{notes.map(({ title, description, icon: Icon }) => (
            <li key={title}>
              <span className="plan-note-icon"><Icon size={25} aria-hidden="true" /></span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}</ul>
        </section>
      </div>

      <div role="status" className={notice ? 'plan-notice' : 'sr-only'}>
        {notice && <><CheckCircle2 size={18} aria-hidden="true" />{notice}</>}
      </div>
      {editing && <PlanEditor key={editing.id} plan={editing} onClose={() => setEditing(null)} onConfirm={savePlan} restoreFocus={() => editTrigger.current?.focus()} />}
    </>
  )
}
