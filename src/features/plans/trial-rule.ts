export interface TrialRule {
  durationDays: number
  version: number
}

export const trialRulePath = '/api/v1/admin/registration-trial'
export const trialClaimLimit = '每个账号仅可领取一次'
export const minTrialDays = 1
export const maxTrialDays = 15

export function parseTrialDuration(value: string): number | null {
  const days = Number(value)
  return /^\d+$/.test(value) && days >= minTrialDays && days <= maxTrialDays ? days : null
}
