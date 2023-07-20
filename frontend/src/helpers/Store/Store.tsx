import { AnyObject } from '@ors/@types/primitives'

export const defaultSliceData = {
  data: null,
  error: null,
  loading: false,
  loaded: false,
}

export function getInitialSliceData(data: AnyObject | null | undefined): {
  data: AnyObject | null | undefined
  error: AnyObject | null | undefined
  loading: Boolean
  loaded: Boolean
} {
  return {
    data,
    error: null,
    loading: false,
    loaded: !!data,
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
