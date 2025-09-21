import { addMinutes, setHours, setMinutes } from 'date-fns'

import { FlopEvent, ICSEvent } from 'types/api'

import { CalendarEvent, EventColor } from '~/calendar/types'

import { extractDurationFromType, getClosestColor, getDayDate } from './utils'

export class JSONEventParser {
  /**
   * Parses a single server event to CalendarEvent
   */
  private static parseEvent(event: FlopEvent): CalendarEvent {
    const date = getDayDate(event.day, event.course.week, event.course.year)
    const startDateTime = setMinutes(setHours(date, 0), event.start_time)
    const duration = extractDurationFromType(event.course.type)
    const endDateTime = addMinutes(startDateTime, duration)

    // Build description
    const groups = event.course.groups
      .map((g) => `${g.train_prog} ${g.name}`)
      .join(', ')
    const description = [
      `Type: ${event.course.type}`,
      `Module: ${event.course.module.name}`,
      `Groups: ${groups}`,
      event.course.supp_tutor.length > 0
        ? `Support Tutors: ${event.course.supp_tutor.join(', ')}`
        : '',
      `Week: ${event.course.week}`,
      `Session: ${event.number}`,
    ]
      .filter(Boolean)
      .join('\n')

    return {
      id: `flop-event-${event.id}`,
      dateRange: {
        start: startDateTime,
        end: endDateTime,
      },
      title: event.course.module.name || event.course.module.abbrev,
      description,
      location: event.room.name,
      staff: event.tutor,
      color: getClosestColor(event.course.module.display.color_bg),
    }
  }

  /**
   * Parses JSON data from server
   */
  static parse(jsonData: string | FlopEvent[]): CalendarEvent[] {
    try {
      const events: FlopEvent[] =
        typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

      if (!Array.isArray(events)) {
        throw new Error('Expected an array of events')
      }

      return events.map((event) => this.parseEvent(event))
    } catch (error) {
      console.error('Error parsing JSON events:', error)
      throw new Error(
        `Failed to parse JSON events: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

export class ICSEventParser {
  /**
   * Parses ICS datetime string to Date object
   */
  private static parseICSDate(dateStr: string): Date {
    // Handle both formats: 20250609T050000Z and 20250609T050000
    const cleanStr = dateStr.replace('Z', '')
    const year = parseInt(cleanStr.substr(0, 4), 10)
    const month = parseInt(cleanStr.substr(4, 2), 10) - 1
    const day = parseInt(cleanStr.substr(6, 2), 10)
    const hour = parseInt(cleanStr.substr(9, 2), 10)
    const minute = parseInt(cleanStr.substr(11, 2), 10)
    const second = parseInt(cleanStr.substr(13, 2), 10)

    // If Z is present, it's UTC time
    if (dateStr.includes('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second))
    }

    return new Date(year, month, day, hour, minute, second)
  }

  /**
   * Unfolds ICS content (handles line continuations)
   */
  private static unfoldLines(content: string): string {
    return content.replace(/\r?\n[ \t]/g, '')
  }

  /**
   * Extracts value from ICS property line
   */
  private static extractValue(line: string): string {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) return ''
    return line.substring(colonIndex + 1).trim()
  }

  /**
   * Parses a single VEVENT block
   */
  private static parseVEvent(eventBlock: string): ICSEvent | null {
    const lines = eventBlock.split(/\r?\n/).filter((line) => line.trim())
    const event: Partial<ICSEvent> = {}

    for (const line of lines) {
      if (line.startsWith('UID:')) {
        event.uid = this.extractValue(line)
      } else if (line.startsWith('DTSTART:') || line.startsWith('DTSTART;')) {
        const value = line.includes(':')
          ? line.split(':')[1]
          : line.split('=')[1]
        event.dtstart = value
      } else if (line.startsWith('DTEND:') || line.startsWith('DTEND;')) {
        const value = line.includes(':')
          ? line.split(':')[1]
          : line.split('=')[1]
        event.dtend = value
      } else if (line.startsWith('SUMMARY:')) {
        event.summary = this.extractValue(line)
      } else if (line.startsWith('DESCRIPTION:')) {
        // Handle multi-line descriptions
        event.description = this.extractValue(line).replace(/\\n/g, '\n')
      } else if (line.startsWith('LOCATION:')) {
        event.location = this.extractValue(line)
      }
    }

    if (!event.uid || !event.dtstart || !event.dtend || !event.summary) {
      return null
    }

    return event as ICSEvent
  }

  /**
   * Checks if event spans multiple days (for allDay detection)
   */
  private static isAllDayEvent(start: Date, end: Date): boolean {
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    // Consider it all-day if it's 24 hours or more, or starts at midnight
    return (
      diffHours >= 24 ||
      (start.getHours() === 0 && start.getMinutes() === 0 && diffHours > 12)
    )
  }

  /**
   * Maps EventColor based on event content
   */
  private static inferColorFromContent(
    summary: string,
    description?: string
  ): EventColor | undefined {
    const content = `${summary} ${description || ''}`.toLowerCase()

    if (content.includes('férié') || content.includes('holiday')) return 'rose'
    if (content.includes('exam') || content.includes('test')) return 'orange'
    if (content.includes('meeting') || content.includes('réunion'))
      return 'violet'
    if (content.includes('tp') || content.includes('lab')) return 'emerald'

    return 'blue' // Default color
  }

  /**
   * Parses ICS/iCal format data
   */
  static parse(icsContent: string): CalendarEvent[] {
    try {
      // Unfold lines first
      const unfoldedContent = this.unfoldLines(icsContent)

      // Extract all VEVENT blocks
      const eventBlocks =
        unfoldedContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || []

      const events: CalendarEvent[] = []

      for (const block of eventBlocks) {
        const icsEvent = this.parseVEvent(block)
        if (!icsEvent) continue

        const startDate = this.parseICSDate(icsEvent.dtstart)
        const endDate = this.parseICSDate(icsEvent.dtend)

        const calendarEvent: CalendarEvent = {
          id: icsEvent.uid,
          allDay: this.isAllDayEvent(startDate, endDate),
          dateRange: {
            start: startDate,
            end: endDate,
          },
          title: icsEvent.summary,
          description: icsEvent.description || '',
          location: icsEvent.location || '',
          color: this.inferColorFromContent(
            icsEvent.summary,
            icsEvent.description
          ),
        }

        // Extract staff from description if present
        if (icsEvent.description) {
          const staffMatch = icsEvent.description.match(/Staff:\s*([^\n]+)/i)
          if (staffMatch) {
            calendarEvent.staff = staffMatch[1].trim()
          }
        }

        events.push(calendarEvent)
      }

      return events
    } catch (error) {
      console.error('Error parsing ICS events:', error)
      throw new Error(
        `Failed to parse ICS events: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
