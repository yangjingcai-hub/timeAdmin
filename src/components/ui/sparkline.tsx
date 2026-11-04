import { useId } from 'react'

export function Sparkline({ path }: { path: string }) {
  const id = useId()

  return (
    <svg className="sparkline" viewBox="0 0 96 45" aria-hidden="true">
      <defs><linearGradient id={id} x2="0%" y2="100%"><stop stopColor="currentColor" stopOpacity=".15"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      <path d={`${path}L94 45H1Z`} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
