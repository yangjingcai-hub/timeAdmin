import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return <div data-slot="table-container" className="relative w-full overflow-x-auto"><table data-slot="table" className={cn('w-full text-sm', className)} {...props} /></div>
}

export function TableHeader(props: ComponentProps<'thead'>) {
  return <thead data-slot="table-header" {...props} />
}

export function TableBody(props: ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" {...props} />
}

export function TableRow(props: ComponentProps<'tr'>) {
  return <tr data-slot="table-row" {...props} />
}

export function TableHead(props: ComponentProps<'th'>) {
  return <th data-slot="table-head" scope="col" {...props} />
}

export function TableCell(props: ComponentProps<'td'>) {
  return <td data-slot="table-cell" {...props} />
}
