'use client'

import { EventCalendar } from './calendar/event-calendar'

export default function BigCalendar() {
  return <EventCalendar initialView="week" events={[]} />
}
