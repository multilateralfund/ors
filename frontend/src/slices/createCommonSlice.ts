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
    countries_for_create: {
      ...defaultSliceData,
      ...(initialState?.common?.countries_for_create || {}),
    },
    countries_for_listing: {
      ...defaultSliceData,
      ...(initialState?.common?.countries_for_listing || {}),
    },
    settings: {
      ...defaultSliceData,
      ...(initialState?.common?.settings || {}),
    },
  }
}
