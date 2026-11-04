import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section data-slot="card" className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'header'>) {
  return <header data-slot="card-header" className={cn('flex items-center justify-between gap-3', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 data-slot="card-title" className={cn('text-lg leading-tight font-bold', className)} {...props} />
}
