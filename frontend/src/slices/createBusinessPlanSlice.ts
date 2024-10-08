import type { CreateSliceProps } from '@ors/types/store'
import type { BusinessPlanSlice } from '@ors/types/store'

import { defaultSliceData } from '@ors/helpers/Store/Store'

export const createBusinessPlanSlice = ({
  initialState,
}: CreateSliceProps): BusinessPlanSlice => {
  return {
    commentTypes: {
      ...defaultSliceData,
      ...(initialState?.businessPlans?.commentTypes || {}),
    },
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
  }
}
