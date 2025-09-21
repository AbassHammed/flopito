'use client'

import { useEffect, useMemo, useState } from 'react'
import { getWeek, setDefaultOptions } from 'date-fns'
import { fr } from 'date-fns/locale'

import { JSONEventParser } from 'lib/event-parser'
import { useRouterStuff } from 'hooks/use-router-stuff'

import { useCoursesQuery } from '../data/get-courses'
import { EventCalendar } from './calendar/event-calendar'
import { CalendarView } from './calendar/types'

export default function BigCalendar() {
  const { searchParams, queryParams } = useRouterStuff()

  const [view, setView] = useState<CalendarView>(
    (searchParams.get('view') as CalendarView) ?? 'week'
  )

  const [eventFilter, setEventFilter] = useState<string>(
    searchParams.get('eventFilter') ?? 'BUT1'
  )

  const currentDate = useMemo(() => {
    return new Date(searchParams.get('cd') ?? Date.now())
  }, [searchParams])

  const { week, dept, year } = useMemo(() => {
    const week = getWeek(currentDate)
    const year = currentDate.getFullYear()
    const dept = searchParams.get('dept') ?? 'INFO'
    return { dept, week, year }
  }, [currentDate, searchParams])

  const { data } = useCoursesQuery({ dept, week, year })

  const { events, groups } = useMemo(() => {
    const events = JSONEventParser.parse(data ?? [])
    const groups = JSONEventParser.extractGroups(events)

    return { events, groups }
  }, [data])

  useEffect(() => {
    setDefaultOptions({ locale: fr, weekStartsOn: 1 })
  }, [])

  const filteredEvents = useMemo(() => {
    if (!eventFilter) return events
    return JSONEventParser.filter(events, [eventFilter])
  }, [events, eventFilter])

  return (
    <EventCalendar
      events={filteredEvents}
      groups={groups}
      eventFilter={eventFilter}
      view={view}
      onViewChange={(newView) => {
        setView(newView)
        queryParams({ set: { view: newView } })
      }}
      onFilterChange={(newFilter) => {
        setEventFilter(newFilter)
        queryParams({ set: { eventFilter: newFilter } })
      }}
      currentDate={currentDate}
      onDateChange={(newDate) => {
        queryParams({ set: { cd: newDate.toISOString() } })
      }}
    />
  )
}
