import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      'bg-slate-800/50 rounded-lg border border-slate-700/50',
      className
    )}>
      {/* Icon */}
      <div className="text-slate-400 mb-4">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-slate-400 text-sm mb-6 max-w-md">
        {description}
      </p>
      
      {/* Action Button (if provided) */}
      {action && (
        <Link href={action.href}>
          <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}
