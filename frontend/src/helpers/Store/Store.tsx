import { AnyObject } from '@ors/@types/primitives'

export function getDefaultSliceData(): {
  data: AnyObject | null | undefined
  error: AnyObject | null | undefined
  loading: Boolean
  loaded: Boolean
} {
  return {
    data: null,
    error: null,
    loading: false,
    loaded: false,
  }
}
export function getPendingSliceData(): { loading: Boolean; loaded: Boolean } {
  return {
    loading: true,
    loaded: false,
  }
}

export function getSuccessSliceData(data: AnyObject | null | undefined): {
  data: AnyObject | null | undefined
  error: AnyObject | null | undefined
  loading: Boolean
  loaded: Boolean
} {
  return {
    data,
    error: null,
    loading: false,
    loaded: true,
  }
}

export function getErrorSliceData(error: AnyObject | null | undefined): {
  data: AnyObject | null | undefined
  error: AnyObject | null | undefined
  loading: Boolean
  loaded: Boolean
} {
  return {
    error,
    data: null,
    loading: false,
    loaded: false,
  }
}
