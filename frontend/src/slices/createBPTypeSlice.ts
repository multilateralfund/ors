import type { BPTypeSlice, CreateSliceProps } from '@ors/types/store'

import { produce } from 'immer'

import { bpTypes } from '@ors/components/manage/Blocks/BusinessPlans/constants'

export const createBPTypeSlice = ({ set }: CreateSliceProps): BPTypeSlice => ({
  bpType: bpTypes[0].id,
  setBPType: (type: string) =>
    set(
      produce((state) => {
        state.bpType.bpType = type
      }),
    ),
})
