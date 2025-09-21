'use client'

import { useEffect } from 'react'
import { setDefaultOptions } from 'date-fns'
import { fr } from 'date-fns/locale'

import { JSONEventParser } from 'lib/event-parser'

import { useCoursesQuery } from '../data/get-courses'
import { EventCalendar } from './calendar/event-calendar'

export default function BigCalendar() {
  //   const { data, isSuccess, isLoading, isError, error } = useTeachersQuery()
  const { data } = useCoursesQuery()

  const courses = data || []
  const events = JSONEventParser.parse(courses)
  const groups = JSONEventParser.extractGroups(courses)

  useEffect(() => {
    setDefaultOptions({ locale: fr })
  }, [])
  return <EventCalendar initialView="week" events={events} groups={groups} />
}
