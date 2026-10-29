import { Card, CardContent } from '@lib/ui/components/card'
import { cn } from '@lib/ui/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  className?: string
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  className
}: StatCardProps) {
  return (
    <Card data-slot="stat-card" size="sm" className={cn(className)}>
      <CardContent className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="font-semibold text-base tabular-nums sm:text-lg">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </CardContent>
    </Card>
  )
}
