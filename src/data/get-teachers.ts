import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { TeachersResponse } from 'types/api'
import { ResponseError } from 'types/base'

import { get, handleError } from './fetcher'

async function getTeachers({ dept = 'INFO' }, signal?: AbortSignal) {
  const { data, error } = await get('/user/tutor', {
    params: {
      query: { dept },
    },
    signal,
  })

  if (error) handleError(error)

  return data as unknown as TeachersResponse
}

export const useTeachersQuery = <TData = TeachersResponse>(
  { dept = 'INFO' },
  {
    enabled = true,
    ...options
  }: Omit<
    UseQueryOptions<TeachersResponse, ResponseError, TData, ['tutors', string]>,
    'queryKey' | 'queryFn'
  > = {}
) =>
  useQuery<TeachersResponse, ResponseError, TData, ['tutors', string]>({
    queryKey: ['tutors', dept],
    queryFn: ({ signal }) => getTeachers({ dept }, signal),
    enabled,
    ...options,
    refetchOnWindowFocus: false,
  })
