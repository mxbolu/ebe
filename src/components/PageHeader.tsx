interface PageHeaderProps {
  title: string
  description: string
  icon?: string
  gradient: string
  actions?: React.ReactNode
}

export default function PageHeader({ title, description, icon, gradient, actions }: PageHeaderProps) {
  return (
    <div className={`${gradient} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-2 sm:mb-3 break-words">
              {icon && <span className="mr-2">{icon}</span>}
              {title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg opacity-90 max-w-3xl">
              {description}
            </p>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
