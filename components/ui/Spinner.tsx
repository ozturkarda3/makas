import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: number
  className?: string
}

export default function Spinner({ size = 32, className }: SpinnerProps) {
  const sizeClass = size ? `h-[${size}px] w-[${size}px]` : 'h-8 w-8'

  return (
    <Loader2 
      className={cn(
        'animate-spin text-slate-400',
        sizeClass,
        className
      )} 
    />
  )
}
