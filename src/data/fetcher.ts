import { API_URL } from 'lib/constants'
import createClient from 'openapi-fetch'

import { ResponseError } from '@/types/base'

const DEFAULT_HEADERS = {
  Accept: 'application/json',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = createClient<any>({
  baseUrl: API_URL,
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
  querySerializer: {
    array: {
      style: 'form',
      explode: false,
    },
  },
})

export const { GET: get } = client

export const handleError = (error: unknown): never => {
  if (error && typeof error === 'object') {
    const errorMessage =
      'msg' in error && typeof error.msg === 'string'
        ? error.msg
        : 'message' in error && typeof error.message === 'string'
          ? error.message
          : undefined

    const errorCode =
      'code' in error && typeof error.code === 'number' ? error.code : undefined

    if (errorMessage) {
      throw new ResponseError(errorMessage, errorCode)
    }
  }

  if (error !== null && typeof error === 'object' && 'stack' in error) {
    console.error(error.stack)
  }

  throw new ResponseError(undefined)
}
