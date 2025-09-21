import { clsx, type ClassValue } from 'clsx'
import { addDays, startOfWeek } from 'date-fns'
import { twMerge } from 'tailwind-merge'

import { EventColor } from '~/calendar/types'

import { COLOR_PALETTE } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to calculate color similarity using Euclidean distance in RGB space
export function getClosestColor(hexColor: string): EventColor {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  let minDistance = Infinity
  let closestColor: EventColor = 'blue'
  // Calculate distance to each color in our palette
  ;(Object.entries(COLOR_PALETTE) as [EventColor, string][]).forEach(
    ([colorName, colorHex]) => {
      const pr = parseInt(colorHex.slice(1, 3), 16)
      const pg = parseInt(colorHex.slice(3, 5), 16)
      const pb = parseInt(colorHex.slice(5, 7), 16)

      // Euclidean distance calculation
      const distance = Math.sqrt(
        Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        closestColor = colorName
      }
    }
  )

  return closestColor
}

export function extractDurationFromType(courseType: string): number {
  const match = courseType.match(/(\d+)h(\d+)?/)
  if (!match) return 90

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2] || '0', 10)
  return hours * 60 + minutes
}

export function getDayDate(
  dayAbbrev: string,
  week: number,
  year: number
): Date {
  const dayMap: Record<string, number> = {
    mo: 1,
    tu: 2,
    we: 3,
    th: 4,
    fr: 5,
    f: 5,
    sa: 6,
    su: 0,
  }

  const dayOfWeek = dayMap[dayAbbrev.toLowerCase()] ?? 1

  const firstThrursday = new Date(year, 0, 1)
  while (firstThrursday.getDay() !== 4) {
    firstThrursday.setDate(firstThrursday.getDate() + 1)
  }

  const weekOne = startOfWeek(firstThrursday, { weekStartsOn: 1 })
  const targetDate = addDays(
    weekOne,
    (week - 1) * 7 + (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
  )

  return targetDate
}
