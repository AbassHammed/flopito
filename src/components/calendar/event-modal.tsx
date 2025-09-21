'use client'

import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Clock, FileText, MapPin, Tag, Users } from 'lucide-react'

import { Badge } from '~/ui/badge'
import { Button } from '~/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/ui/dialog'

import { CalendarEvent, DateRange } from './types'

interface EventDialogProps {
  event: CalendarEvent
  isOpen: boolean
  onClose: () => void
}

export function EventDialog({ event, isOpen, onClose }: EventDialogProps) {
  const formatDateRange = (dateRange: DateRange, allDay?: boolean) => {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    const sameDay = isSameDay(startDate, endDate)

    if (allDay) {
      return sameDay
        ? format(startDate, 'EEEE d MMMM yyyy', { locale: fr })
        : `${format(startDate, 'd MMM', { locale: fr })} - ${format(endDate, 'd MMM yyyy', { locale: fr })}`
    }

    if (sameDay) {
      return `${format(startDate, 'EEEE d MMMM yyyy', { locale: fr })} • ${format(startDate, 'HH:mm', { locale: fr })} - ${format(endDate, 'HH:mm', { locale: fr })}`
    }

    return `${format(startDate, 'd MMM HH:mm', { locale: fr })} - ${format(endDate, 'd MMM yyyy HH:mm', { locale: fr })}`
  }
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            {event.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-muted-foreground">
                  Date & Time
                </p>
                <p className="text-sm break-words">
                  {formatDateRange(event.dateRange, event.allDay)}
                </p>
                {event?.allDay && (
                  <Badge variant="outline" className="mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    Toute la journée
                  </Badge>
                )}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-muted-foreground">
                    Location
                  </p>
                  <p className="text-sm break-words">{event.location}</p>
                </div>
              </div>
            )}

            {event.staff && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-muted-foreground">
                    Staff
                  </p>
                  <p className="text-sm break-words">{event.staff}</p>
                </div>
              </div>
            )}

            {event.groups && event.groups.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-muted-foreground">
                    Groups
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {event.groups.map((group) => (
                      <Badge
                        key={group.id}
                        variant={group.is_structural ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {group.name}
                        {group.train_prog && (
                          <span className="ml-1 opacity-70">
                            ({group.train_prog})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-row sm:justify-end">
          <div className="flex flex-1 justify-end gap-2">
            <Button onClick={onClose}>Cancel</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
