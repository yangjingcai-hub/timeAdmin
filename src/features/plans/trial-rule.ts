export interface TrialRule {
  durationDays: number
}

export const trialClaimLimit = '每个账号一次'
const storageKey = 'focustime-admin:mock-trial-rule:v1'

export function parseTrialDuration(value: string): number | null {
  const text = value.trim()
  const days = Number(text)
  return /^\d+$/.test(text) && Number.isSafeInteger(days) && days > 0 ? days : null
}

export function readTrialRule(): TrialRule {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (typeof saved === 'object' && saved !== null && 'durationDays' in saved &&
      typeof saved.durationDays === 'number' && parseTrialDuration(String(saved.durationDays)) !== null) {
      return { durationDays: saved.durationDays }
    }
  } catch {
    // The editor remains available when local storage is unavailable.
  }
  return { durationDays: 3 }
}

export function storeTrialRule(rule: TrialRule) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(rule))
  } catch {
    // Match the existing plan editor by retaining the in-memory configuration.
  }
}
