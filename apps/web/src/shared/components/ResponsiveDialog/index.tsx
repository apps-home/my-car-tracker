'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@lib/ui/components/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@lib/ui/components/sheet'
import { cn } from '@lib/ui/lib/utils'

import { useMediaQuery } from '@/shared/hooks/use-media-query'

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}

/** Sheet inferior no celular (lançamento com o polegar) e Dialog no desktop */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  children
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-slot="responsive-dialog"
          className={cn('max-h-[90svh] overflow-y-auto sm:max-w-lg', className)}
        >
          <DialogHeader>
            <DialogTitle className="text-sm">{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-slot="responsive-dialog"
        className={cn('max-h-[92svh] overflow-y-auto rounded-t-xl', className)}
      >
        <SheetHeader>
          <SheetTitle className="text-sm">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
