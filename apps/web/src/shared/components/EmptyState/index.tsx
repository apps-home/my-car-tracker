import { cn } from '@lib/ui/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm">{title}</p>
      {description && (
        <p className="max-w-sm text-muted-foreground text-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
