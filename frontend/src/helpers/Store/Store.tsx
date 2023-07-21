import { DataType, ErrorType } from '@ors/@types/primitives'

export const defaultSliceData = {
  data: null,
  error: null,
  loaded: false,
  loading: false,
}

export function getInitialSliceData(data: DataType): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  return {
    data,
    error: null,
    loaded: !!data,
    loading: false,
  }
}

export function getPendingSliceData(): { loaded: boolean; loading: boolean } {
  return {
    loaded: false,
    loading: true,
  }
}

export function getSuccessSliceData(data: DataType): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  return {
    data,
    error: null,
    loaded: true,
    loading: false,
  }
}

export function getErrorSliceData(error: ErrorType): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  return {
    data: null,
    error,
    loaded: false,
    loading: false,
  }
}
