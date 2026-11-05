export class ApiError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super(`API request failed (${status})`)
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, { ...options, headers, credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) {
    let code: string | undefined
    if (response.headers.get('content-type')?.includes('json')) {
      try {
        const problem: unknown = await response.json()
        if (problem && typeof problem === 'object' && 'code' in problem && typeof problem.code === 'string') code = problem.code
      } catch { /* Preserve the HTTP failure even when its response is incomplete. */ }
    }
    throw new ApiError(response.status, code)
  }
  if (response.status === 204) return undefined as T
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Invalid API response')
  return response.json() as Promise<T>
}
