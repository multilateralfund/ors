import type { CreateSliceProps } from '@ors/types/store'
import type { CommonSlice } from '@ors/types/store'

import { defaultSliceData, setSlice } from '@ors/helpers/Store/Store'

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
    setSettings: (settings) => {
      setSlice('common.settings', settings)
    },
    settings: {
      ...defaultSliceData,
      ...(initialState?.common?.settings || {}),
    },
    user_permissions: {
      ...defaultSliceData,
      ...(initialState?.common?.user_permissions || {}),
    },
  }
}
