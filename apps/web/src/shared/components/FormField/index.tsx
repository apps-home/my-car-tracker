import { Label } from '@lib/ui/components/label'
import { cn } from '@lib/ui/lib/utils'

interface FormFieldProps {
  id: string
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  id,
  label,
  hint,
  className,
  children
}: FormFieldProps) {
  return (
    <div data-slot="form-field" className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
