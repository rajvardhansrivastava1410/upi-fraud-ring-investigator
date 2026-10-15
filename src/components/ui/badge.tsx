import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'critical' | 'warning' | 'success' | 'info'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-destructive/20 text-destructive border border-destructive/30',
    critical: 'border-transparent bg-red-950/80 text-red-400 border border-red-800/60 font-semibold',
    warning: 'border-transparent bg-amber-950/80 text-amber-300 border border-amber-800/60',
    success: 'border-transparent bg-emerald-950/80 text-emerald-300 border border-emerald-800/60',
    info: 'border-transparent bg-blue-950/80 text-blue-300 border border-blue-800/60',
    outline: 'text-foreground border border-border',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
