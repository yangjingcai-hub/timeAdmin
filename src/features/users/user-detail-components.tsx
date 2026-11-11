import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X, type LucideIcon } from 'lucide-react'
import { createContext, useContext, useRef, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DetailTone, UserDetailRequest } from './user-detail-api'

export const UserDetailEmbeddedContext = createContext(false)

export function UserDetailRequestState({ request }: { request: Pick<UserDetailRequest<unknown>, 'loading' | 'error' | 'retry'> }) {
  return <div className="user-request-state" role={request.error ? 'alert' : 'status'}>
    <p>{request.error || '正在加载数据…'}</p>
    {request.error && <Button type="button" variant="ghost" onClick={request.retry}>重试</Button>}
  </div>
}

export function UserDetailStatus({ tone = 'neutral', children }: { tone?: DetailTone; children: ReactNode }) {
  return <Badge className={`user-subpage-status user-subpage-status-${tone}`}>{children}</Badge>
}

export function UserSubpageHeading({ title, description, icon: Icon, action }: {
  title: string; description: string; icon: LucideIcon; action?: ReactNode
}) {
  const embedded = useContext(UserDetailEmbeddedContext)
  const Title = embedded ? 'h2' : Dialog.Title
  const Description = embedded ? 'p' : Dialog.Description
  return <header className="user-subpage-heading">
    <div><Title><Icon size={28} strokeWidth={1.8} aria-hidden="true" />{title}</Title>
      <Description>{description}</Description></div>
    {action}
  </header>
}

export function UserSubpageCard({ title, icon: Icon, action, children }: {
  title: string; icon: LucideIcon; action?: ReactNode; children: ReactNode
}) {
  return <section className="user-subpage-card" aria-label={title}>
    <header><h3><Icon size={25} strokeWidth={1.8} aria-hidden="true" />{title}</h3>{action}</header>
    {children}
  </section>
}

// Nested Radix dialogs share focus trapping and Escape handling with the main modal.
export function UserDetailSubdialog({ title, description, onClose, children, confirmation, onConfirm, confirmLabel = '确认退出', busy = false, className = '', overlayClassName = '', primary = false, restoreFocus }: {
  title: string; description: string; onClose: () => void; children?: ReactNode
  confirmation?: boolean; onConfirm?: () => void; confirmLabel?: string; busy?: boolean; className?: string; overlayClassName?: string; primary?: boolean; restoreFocus?: () => void
}) {
  const initialFocus = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className={`user-subdialog-overlay ${overlayClassName}`} />
      <Dialog.Content className={`user-subdialog ${className}`} role={confirmation ? 'alertdialog' : 'dialog'}
        onInteractOutside={event => { if (busy) event.preventDefault() }}
        onOpenAutoFocus={event => {
          previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          event.preventDefault(); initialFocus.current?.focus()
        }} onCloseAutoFocus={event => {
          event.preventDefault()
          if (restoreFocus) { restoreFocus(); return }
          const target = previousFocus.current
          if (target?.isConnected && !target.matches(':disabled')) target.focus()
          else target?.closest('.user-detail-modal, .order-modal')?.querySelector<HTMLElement>('.user-detail-nav [aria-current="page"]')?.focus()
        }} onEscapeKeyDown={event => { event.stopPropagation(); if (busy) event.preventDefault() }}>
        <header><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={`关闭${title}`}><X size={19} aria-hidden="true" /></Button></Dialog.Close>
        </header>
        {children && <div className="user-subdialog-body">{children}</div>}
        <footer><Dialog.Close asChild><Button ref={initialFocus} type="button" variant="ghost" disabled={busy} className="user-subpage-button">{confirmation ? '取消' : '关闭'}</Button></Dialog.Close>
          {confirmation && <Button type="button" disabled={busy} className={primary ? 'user-subpage-primary' : 'user-subpage-danger'} onClick={onConfirm}>{busy ? '正在提交…' : confirmLabel}</Button>}
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}

export function UserDetailPagination({ total, page, pageSize, onChange, label = '日志', summary = `共 ${total} 条记录` }: {
  total: number; page: number; pageSize: number; onChange: (page: number) => void; label?: string; summary?: string
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const pages = Array.from(new Set([1, ...Array.from({ length: 5 }, (_, index) => page - 2 + index), pageCount]))
    .filter(number => number >= 1 && number <= pageCount).sort((a, b) => a - b)
  return <footer className="user-subpage-pagination">
    <p role="status">{summary}</p>
    <nav aria-label={`用户${label}分页`}>
      <Button type="button" variant="ghost" size="icon" aria-label={`${label}上一页`} disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={18} aria-hidden="true" /></Button>
      {pages.map((number, index) => <span key={number} className="user-detail-page-item">
        {index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
        <Button type="button" variant="ghost" size="icon" aria-label={`${label}第 ${number} 页`} aria-current={page === number ? 'page' : undefined} onClick={() => onChange(number)}>{number}</Button>
      </span>)}
      <Button type="button" variant="ghost" size="icon" aria-label={`${label}下一页`} disabled={page === pageCount} onClick={() => onChange(page + 1)}><ChevronRight size={18} aria-hidden="true" /></Button>
    </nav>
  </footer>
}
