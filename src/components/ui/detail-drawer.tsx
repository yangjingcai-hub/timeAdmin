import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import './detail-drawer.css'

interface DetailDrawerContentProps {
  title: string
  description: string
  children: ReactNode
  restoreFocus: () => void
  placement?: 'side' | 'center'
  className?: string
  onInteractOutside?: ComponentProps<typeof Dialog.Content>['onInteractOutside']
}

export function DetailDrawerContent({ title, description, children, restoreFocus, placement = 'side', className, onInteractOutside }: DetailDrawerContentProps) {
  return (
    <Dialog.Content className={cn('detail-surface', placement === 'center' ? 'detail-modal' : 'detail-drawer', className)}
      onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus() }} onInteractOutside={onInteractOutside}>
      <header className="detail-drawer-header">
        <div>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
        </div>
        <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" aria-label="关闭" className="detail-drawer-close"><X size={20} aria-hidden="true" /></Button></Dialog.Close>
      </header>
      <div className="detail-drawer-body">{children}</div>
    </Dialog.Content>
  )
}
