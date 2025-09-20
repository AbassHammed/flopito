'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function useRouterStuff() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsObj = Object.fromEntries(searchParams)

  const getQueryString = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kv?: Record<string, any>,
    opts?: {
      ignore?: string[]
    }
  ) => {
    const newParams = new URLSearchParams(searchParams)

    if (kv) {
      Object.entries(kv).forEach(([k, v]) => {
        if (opts?.ignore?.includes(k)) return
        newParams.set(k, v)
      })
    }

    if (opts?.ignore) {
      opts.ignore.forEach((k) => {
        newParams.delete(k)
      })
    }

    const queryString = newParams.toString()
    return queryString.length > 0 ? `?${queryString}` : ''
  }

  const queryParams = ({
    set,
    del,
    replace,
    scroll = true,
    getNewPath,
    arrayDelimiter = ',',
  }: {
    set?: Record<string, string | string[]>
    del?: string | string[]
    replace?: boolean
    scroll?: boolean
    getNewPath?: boolean
    arrayDelimiter?: string
  }) => {
    const newParams = new URLSearchParams(searchParams)
    if (set) {
      Object.entries(set).forEach(([k, v]) => {
        newParams.set(k, Array.isArray(v) ? v.join(arrayDelimiter) : v)
      })
    }
    if (del) {
      const delArray = Array.isArray(del) ? del : [del]
      delArray.forEach((k) => {
        newParams.delete(k)
      })
    }

    const queryString = newParams.toString()
    const newpath = `${pathname}${
      queryString.length > 0 ? `?${queryString}` : ''
    }`
    if (getNewPath) return newpath
    if (replace) {
      router.replace(newpath, { scroll: false })
    } else {
      router.push(newpath, { scroll })
    }
  }

  return {
    pathname,
    router,
    searchParams,
    searchParamsObj,
    queryParams,
    getQueryString,
  }
}
