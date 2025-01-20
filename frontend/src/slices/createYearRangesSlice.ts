import type { BPYearRangesSlice } from '@ors/types/store'
import { DataType, ErrorType, SliceData } from '@ors/types/primitives'

import { fetchSliceData } from '@ors/helpers/Store/Store'

export const defaultSliceData: SliceData = {
  data: null,
  error: null,
  loaded: false,
  loading: false,
}

export function getInitialSliceData<D = DataType, E = ErrorType>(
  data?: D,
): SliceData<D, E> {
  return {
    ...defaultSliceData,
    data: data || null,
    error: null,
    loaded: !!data,
    loading: false,
  } as SliceData<D, E>
}

export const createYearRangesSlice = (): BPYearRangesSlice => {
  return {
    yearRanges: {
      ...getInitialSliceData(),
    },
    fetchYearRanges: async () => {
      const yearRangesPath = `api/business-plan/get-years/`

      return await fetchSliceData({
        apiSettings: {
          path: yearRangesPath,
        },
        slice: 'yearRanges.yearRanges',
      })
    },
  }
}
