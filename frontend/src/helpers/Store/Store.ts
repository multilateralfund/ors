import type { DataType, ErrorType, SliceData } from '@ors/types/primitives'

export const defaultSliceData = {
  data: null,
  error: null,
  loaded: false,
  loading: false,
}

export function getInitialSliceData(data: DataType): SliceData {
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

export function getSuccessSliceData(data: DataType): SliceData {
  return {
    data,
    error: null,
    loaded: true,
    loading: false,
  }
}

export function getErrorSliceData(error: ErrorType): SliceData {
  return {
    data: null,
    error,
    loaded: false,
    loading: false,
  }
}
