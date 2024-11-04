import type {
  BPSlice,
  CreateSliceProps,
  UpdatedBusinessPlan,
} from '@ors/types/store'

import { produce } from 'immer'

export const createBPSlice = ({ set }: CreateSliceProps): BPSlice => ({
  businessPlan: {} as UpdatedBusinessPlan,
  setBusinessPlan: (business_plan: UpdatedBusinessPlan) =>
    set(
      produce((state) => {
        state.businessPlan.businessPlan = business_plan
      }),
    ),
})
