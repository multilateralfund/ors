import type { CommonSlice } from '@ors/types/store'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { CreateSliceProps } from '@ors/store'

export const createCommonSlice = ({
  initialState,
}: CreateSliceProps): CommonSlice => {
  return {
    agencies: {
      ...defaultSliceData,
      ...(initialState?.common?.agencies || {}),
    },
    countries: {
      ...defaultSliceData,
      ...(initialState?.common?.countries || {}),
    },
    settings: {
      ...defaultSliceData,
      ...(initialState?.common?.settings || {}),
    },
  }
}
