import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api'
import type { Order } from './order-types'

export const refundReasons = {
  'within-guarantee': '用户申请无理由退款（3天内）', 'duplicate-payment': '重复支付',
  'wrong-purchase': '购买错误', 'service-issue': '服务问题', other: '其他原因',
} as const
export function estimatedOrderTime(order: Order) {
  return order.clock ? Date.parse(order.clock.serverTimeUtc) + Math.max(0, performance.now() - order.clock.receivedAt) : Date.now()
}
export function refundWindow(order: Order, now = estimatedOrderTime(order)) {
  const deadline = order.refund?.deadlineAtUtc ? Date.parse(order.refund.deadlineAtUtc)
    : order.payment.paidAtUtc ? Date.parse(order.payment.paidAtUtc) + 72 * 3600000 : null
  const paidAt = order.payment.paidAtUtc ? Date.parse(order.payment.paidAtUtc) : null
  const paid = order.payment.status === 'paid' && paidAt !== null && now >= paidAt
  return { deadline, expired: paid && deadline !== null && now > deadline,
    eligible: paid && deadline !== null && now <= deadline && !order.refund?.receipt,
    remaining: deadline !== null ? Math.max(0, deadline - now) : 0 }
}
export function useRefundWindow(order: Order | null) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!order) return
    const update = () => tick(value => value + 1)
    const timer = window.setInterval(update, 1000)
    const { deadline } = refundWindow(order)
    const wait = deadline === null ? -1 : deadline - estimatedOrderTime(order) + 1
    const expiry = wait > 0 && wait < 2147483647 ? window.setTimeout(update, wait) : null
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    return () => { window.clearInterval(timer); if (expiry !== null) window.clearTimeout(expiry); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update) }
  }, [order?.orderId, order?.clock?.serverTimeUtc, order?.clock?.receivedAt, order?.refund?.deadlineAtUtc])
  return order ? refundWindow(order) : null
}
export function refundAmountCents(value: string): number | null {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value.trim())) return null
  const [whole, part = ''] = value.trim().split('.')
  const cents = Number(whole) * 100 + Number(part.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}
export function refundError(error: unknown) {
  const messages: Record<string, string> = {
    refund_period_expired: '已超过支付完成后的 72 小时退款期限，不能继续提交。',
    order_already_refunded: '该订单已退款，请关闭弹窗并刷新订单详情。', order_refunding: '订单正在退款处理中，请勿重复提交。',
    refund_provider_not_supported: '该支付渠道尚未接入退款，未执行资金退款或权益撤销。',
    refund_amount_exceeds_payment: '退款金额不能超过支付金额。', invalid_refund_request: '请检查退款金额、原因及备注。',
    refund_operation_conflict: '本次提交标识与原退款内容不一致，请刷新订单后重试。',
    refund_grant_binding_invalid: '无法核实该订单对应的会员权益，操作已停止。',
    order_not_paid: '该订单未支付，不能退款。', invalid_payment_time: '支付完成时间异常，不能退款。',
  }
  return error instanceof ApiError && error.code && messages[error.code] ? messages[error.code]
    : '退款结果未能确认。请保持原填写内容重试；系统会核对原提交记录，避免重复退款。'
}
