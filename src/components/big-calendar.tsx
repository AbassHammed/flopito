'use client'

import { useEffect, useMemo } from 'react'
import { getWeek, setDefaultOptions } from 'date-fns'
import { fr } from 'date-fns/locale'

import { JSONEventParser } from 'lib/event-parser'
import { useRouterStuff } from 'hooks/use-router-stuff'

import { useCoursesQuery } from '../data/get-courses'
import { EventCalendar } from './calendar/event-calendar'

export default function BigCalendar() {
  const { searchParams } = useRouterStuff()

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

  return <EventCalendar initialView="week" events={events} groups={groups} />
}
