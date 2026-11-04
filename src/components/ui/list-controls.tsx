import { ChevronDown, ChevronLeft, ChevronRight, Search, type LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import './list-controls.css'

export function ListSearch(props: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <label className="list-search">
      <Search size={17} aria-hidden="true" />
      <input {...props} type="search" />
    </label>
  )
}

export function ListSelect({ label, className, icon: Icon, ...props }: ComponentProps<'select'> & { label: string; icon?: LucideIcon }) {
  return (
    <label className={cn('list-select', className)}>
      {Icon && <Icon className="list-select-icon" size={16} aria-hidden="true" />}
      <span>{label}</span>
      <select {...props} aria-label={props['aria-label'] ?? label} />
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  )
}

export function ListEmpty({ message, onClear }: { message: string; onClear: () => void }) {
  return (
    <div className="list-empty">
      <span className="list-empty-icon"><Search size={23} aria-hidden="true" /></span>
      <p>{message}</p>
      <Button type="button" variant="ghost" className="list-clear-filters" onClick={onClear}>清除筛选</Button>
    </div>
  )
}

const pageSizes = [10, 20, 50, 100]
const formatCount = new Intl.NumberFormat('zh-CN').format

function visiblePages(page: number, pageCount: number) {
  if (pageCount <= 6) return Array.from({ length: pageCount }, (_, index) => index + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, 'end-gap', pageCount]
  if (page >= pageCount - 3) return [1, 'start-gap', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  return [1, 'start-gap', page - 1, page, page + 1, 'end-gap', pageCount]
}

interface ListPaginationProps {
  total: number
  page: number
  pageCount: number
  pageSize: number
  navigationLabel: string
  countLabel: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function ListPagination({ total, page, pageCount, pageSize, navigationLabel, countLabel, onPageChange, onPageSizeChange }: ListPaginationProps) {
  return (
    <footer className="list-pagination">
      <p role="status" className="list-results-count">共 {formatCount(total)} {countLabel}</p>
      <ListSelect label="每页" className="list-page-size" aria-label="每页条数" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
        {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
      </ListSelect>
      {pageCount > 0 && (
        <nav className="list-pages" aria-label={navigationLabel}>
          <Button type="button" variant="ghost" size="icon" className="list-page-arrow" aria-label="上一页" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft size={17} aria-hidden="true" />
          </Button>
          {visiblePages(page, pageCount).map((item) => typeof item === 'number' ? (
            <Button key={item} type="button" variant="ghost" size="sm" aria-label={`第 ${item} 页`} aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}>{formatCount(item)}</Button>
          ) : <span key={item} aria-hidden="true" className="list-page-gap">…</span>)}
          <Button type="button" variant="ghost" size="icon" className="list-page-arrow" aria-label="下一页" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
            <ChevronRight size={17} aria-hidden="true" />
          </Button>
        </nav>
      )}
    </footer>
  )
}
