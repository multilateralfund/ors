import {
  BusinessPlanData,
  BusinessPlanDataSlice,
  CreateSliceProps,
} from '@ors/types/store'

import { setSlice } from '@ors/helpers/Store/Store'

export const createBusinessPlanDataSlice = ({
  initialState,
}: CreateSliceProps): BusinessPlanDataSlice => {
  const initialBusinessPlanData: BusinessPlanData = {
    business_plan: null,
    history: null,
    records: null,
  }
  return {
    businessPlanData: initialBusinessPlanData,
    setBusinessPlanData: (newBusinessPlanData: Partial<BusinessPlanData>) => {
      setSlice('businessPlanData.businessPlanData', newBusinessPlanData)
    },
  }
}
