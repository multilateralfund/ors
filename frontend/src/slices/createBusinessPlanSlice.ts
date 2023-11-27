import type { BusinessPlanSlice } from '@ors/types/store'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { CreateSliceProps } from '@ors/store'

export const createBusinessPlanSlice = ({
  initialState,
}: CreateSliceProps): BusinessPlanSlice => {
  return {
    sectors: {
      ...defaultSliceData,
      ...(initialState?.businessPlans?.sectors || {}),
    },
    subsectors: {
      ...defaultSliceData,
      ...(initialState?.businessPlans?.subsectors || {}),
    },
    types: {
      ...defaultSliceData,
      ...(initialState?.businessPlans?.types || {}),
    },
    yearRanges: {
      ...defaultSliceData,
      ...(initialState?.businessPlans?.yearRanges || {}),
    },
  }
}
