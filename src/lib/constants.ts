import { EventColor } from '~/calendar/types'

export const API_URL = (() => {
  return process.env.NEXT_PUBLIC_API_URL!
})()

export const COLOR_PALETTE: Record<EventColor, string> = {
  blue: '#3b82f6',
  orange: '#f97316',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  emerald: '#10b981',
}
