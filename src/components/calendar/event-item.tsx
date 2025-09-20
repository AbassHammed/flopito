import { CalendarEvent } from './types'

interface EventWrapperProps {
  event: CalendarEvent
  isFirstDay?: boolean
  isLastDay?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  children: React.ReactNode
  currentTime?: Date
}
