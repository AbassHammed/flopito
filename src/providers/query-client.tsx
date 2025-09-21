'use client'

import {
  dehydrate,
  HydrationBoundary,
  QueryClientProvider,
} from '@tanstack/react-query'

import { useRootQueryClient } from '../data/query-client'

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = useRootQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  )
}
