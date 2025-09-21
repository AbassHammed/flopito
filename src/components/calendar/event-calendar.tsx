'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'

import { PromoGroups } from 'types/base'
import {
  AgendaDaysToShow,
  EventGap,
  EventHeight,
  WeekCellsHeight,
} from './lib/constants'
import { JSONEventParser } from 'lib/event-parser'
import { cn } from 'lib/utils'

import ThemeToggle from '~/theme-toggle'
import { Button } from '~/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/ui/dropdown-menu'

import { AgendaView } from './agenda-view'
import { DayView } from './day-view'
import { EventDialog } from './event-modal'
import { MonthView } from './month-view'
import { CalendarEvent, CalendarView } from './types'
import { WeekView } from './week-view'

interface EventCalendarProps {
  events: CalendarEvent[]
  groups: PromoGroups[]
  className?: string
  view: CalendarView
  eventFilter: string
  onViewChange: (view: CalendarView) => void
  onFilterChange: (filter: string) => void
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function EventCalendar({
  events = [],
  groups = [],
  className,
  view,
  eventFilter,
  onViewChange,
  onFilterChange,
  currentDate,
  onDateChange,
}: EventCalendarProps) {
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Add keyboard shortcuts for view switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          onViewChange('month')
          break
        case 'w':
          onViewChange('week')
          break
        case 'd':
          onViewChange('day')
          break
        case 'a':
          onViewChange('agenda')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEventDialogOpen, onViewChange])

  const filteredEvents = useMemo(() => {
    if (!eventFilter) return events
    return JSONEventParser.filter(events, [eventFilter])
  }, [events, eventFilter])

  const handlePrevious = () => {
    if (view === 'month') {
      onDateChange(subMonths(currentDate, 1))
    } else if (view === 'week') {
      onDateChange(subWeeks(currentDate, 1))
    } else if (view === 'day') {
      onDateChange(addDays(currentDate, -1))
    } else if (view === 'agenda') {
      // For agenda view, go back 30 days (a full month)
      onDateChange(addDays(currentDate, -AgendaDaysToShow))
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      onDateChange(addMonths(currentDate, 1))
    } else if (view === 'week') {
      onDateChange(addWeeks(currentDate, 1))
    } else if (view === 'day') {
      onDateChange(addDays(currentDate, 1))
    } else if (view === 'agenda') {
      onDateChange(addDays(currentDate, AgendaDaysToShow))
      // For agenda view, go forward 30 days (a full month)
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventDialogOpen(true)
  }

  const viewTitle = useMemo(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: fr })
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0, locale: fr })
      const end = endOfWeek(currentDate, { weekStartsOn: 0, locale: fr })
      if (isSameMonth(start, end)) {
        return format(start, 'MMMM yyyy')
      } else {
        return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`
      }
    } else if (view === 'day') {
      return (
        <>
          <span className="min-sm:hidden" aria-hidden="true">
            {format(currentDate, 'MMM d, yyyy', { locale: fr })}
          </span>
          <span className="max-sm:hidden min-md:hidden" aria-hidden="true">
            {format(currentDate, 'MMMM d, yyyy', { locale: fr })}
          </span>
          <span className="max-md:hidden">
            {format(currentDate, 'EEE MMMM d, yyyy', { locale: fr })}
          </span>
        </>
      )
    } else if (view === 'agenda') {
      // Show the month range for agenda view
      const start = currentDate
      const end = addDays(currentDate, AgendaDaysToShow - 1)

      if (isSameMonth(start, end)) {
        return format(start, 'MMMM yyyy', { locale: fr })
      } else {
        return `${format(start, 'MMM', { locale: fr })} - ${format(end, 'MMM yyyy', { locale: fr })}`
      }
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: fr })
    }
  }, [currentDate, view])

  return (
    <div
      className="flex has-data-[slot=month-view]:flex-1 flex-col rounded-lg"
      style={
        {
          '--event-height': `${EventHeight}px`,
          '--event-gap': `${EventGap}px`,
          '--week-cells-height': `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-5 sm:px-4',
          className
        )}
      >
        <div className="flex sm:flex-col max-sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-xl lg:peer-data-[state=invisible]:-translate-x-7.5 transition-transform ease-in-out duration-300">
              {viewTitle}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center sm:gap-2 max-sm:order-1">
              <Button
                variant="ghost"
                size="icon"
                className="max-sm:size-8"
                onClick={handlePrevious}
                aria-label="Previous"
              >
                <ChevronLeftIcon size={16} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="max-sm:size-8"
                onClick={handleNext}
                aria-label="Next"
              >
                <ChevronRightIcon size={16} aria-hidden="true" />
              </Button>
            </div>
            <Button className="max-sm:h-8 max-sm:px-2.5!" onClick={handleToday}>
              Aujourd&apos;hui
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1.5 max-sm:h-8 max-sm:px-2! max-sm:gap-1"
                >
                  {eventFilter}
                  <ChevronDownIcon
                    className="-me-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                {groups.map((group) => (
                  <DropdownMenuSub key={group.promo}>
                    <DropdownMenuSubTrigger key={group.promo}>
                      {group.promo}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {group.hierarchy.children?.map((subgroup) => (
                          <DropdownMenuItem
                            key={subgroup.id}
                            onClick={() => {
                              onFilterChange(subgroup.name)
                            }}
                          >
                            {subgroup.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-1.5 max-sm:h-8 max-sm:px-2! max-sm:gap-1"
                >
                  <span className="capitalize">{view}</span>
                  <ChevronDownIcon
                    className="-me-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem
                  onClick={() => {
                    onViewChange('month')
                  }}
                >
                  Mois <DropdownMenuShortcut>M</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onViewChange('week')
                  }}
                >
                  Semaine <DropdownMenuShortcut>W</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onViewChange('day')
                  }}
                >
                  Jour <DropdownMenuShortcut>D</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onViewChange('agenda')
                  }}
                >
                  Agenda <DropdownMenuShortcut>A</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onEventSelect={handleEventSelect}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onEventSelect={handleEventSelect}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onEventSelect={handleEventSelect}
          />
        )}
        {view === 'agenda' && (
          <AgendaView
            currentDate={currentDate}
            events={filteredEvents}
            onEventSelect={handleEventSelect}
          />
        )}
      </div>

      {selectedEvent && (
        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          onClose={() => {
            setIsEventDialogOpen(false)
            setSelectedEvent(null)
          }}
        />
      )}
    </div>
  )
}
