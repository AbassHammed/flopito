import { useState } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { ResponseError } from 'types/base'

let queryClient: QueryClient | undefined

function getQueryClient() {
  const _queryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry(failureCount, error) {
            // we don't want to retry on 4xx
            // but we want to retry on only 401 errors
            if (
              error instanceof ResponseError &&
              error.code !== undefined &&
              error.code > 401 &&
              error.code < 500
            ) {
              return false
            }

            if (failureCount < 3) {
              return true
            }

            return false
          },
        },
      },
    })

  // For SSG and SSR always create a new queryClient
  if (typeof window === 'undefined') return _queryClient
  // Create the queryClient once in the client
  if (!queryClient) queryClient = _queryClient

  return queryClient
}

export function useRootQueryClient() {
  const [_queryClient] = useState(() => getQueryClient())

  return _queryClient
}
