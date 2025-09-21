import { FlopGroup } from 'types/api'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export interface DateRange {
  start: Date
  end: Date
}

export interface CalendarEvent {
  id: string
  allDay?: boolean
  dateRange: DateRange
  title: string
  description: string
  location: string
  staff?: string
  color?: EventColor
  groups?: FlopGroup[]
}

export type EventColor = 'blue' | 'orange' | 'violet' | 'rose' | 'emerald'
