'use client'

import { cn } from 'lib/utils'

interface CellProps {
  time?: number // For week/day views, represents hours (e.g., 9.25 for 9:15)
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Cell({ time, children, className }: CellProps) {
  // Format time for display in tooltip (only for debugging)
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, '0')}`
      : null

  return (
    <div
      className={cn(
        'data-dragging:bg-accent flex h-full flex-col px-0.5 py-1 sm:px-1',
        className
      )}
      title={formattedTime ? `${formattedTime}` : undefined}
    >
      {children}
    </div>
  )
}
