import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getWeek } from 'date-fns'

import { FlopEvent } from 'types/api'
import { ResponseError } from 'types/base'

import { get, handleError } from './fetcher'

async function getCourses(
  { dept, week, year }: { dept: string; week: number; year: number },
  signal?: AbortSignal
) {
  const { data, error } = await get('/fetch/scheduledcourses', {
    params: {
      query: { dept, week, year },
    },
    signal,
  })

  if (error) handleError(error)

  return data as unknown as FlopEvent[]
}

export const useCoursesQuery = <TData = FlopEvent[]>(
  {
    dept = 'INFO',
    week = getWeek(new Date()),
    year = new Date().getFullYear(),
  }: { dept?: string; week?: number; year?: number } = {},
  {
    enabled = true,
    ...options
  }: Omit<
    UseQueryOptions<
      FlopEvent[],
      ResponseError,
      TData,
      ['scheduledcourses', string, number, number]
    >,
    'queryKey' | 'queryFn'
  > = {}
) =>
  useQuery<
    FlopEvent[],
    ResponseError,
    TData,
    ['scheduledcourses', string, number, number]
  >({
    queryKey: ['scheduledcourses', dept, week, year],
    queryFn: ({ signal }) => getCourses({ dept, week, year }, signal),
    enabled,
    ...options,
    refetchOnWindowFocus: false,
  })
