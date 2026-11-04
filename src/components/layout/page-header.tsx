import { useEffect, type ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  useEffect(() => { document.title = `${title} · 专注时光` }, [title])

  return (
    <header className="page-heading">
      <h1>{title}</h1>
      <p>{description}</p>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </header>
  )
}
