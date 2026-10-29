interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className="flex flex-wrap items-end justify-between gap-3"
    >
      <div>
        <h1 className="font-bold text-foreground text-xl sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
