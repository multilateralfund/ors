import type { BPTypeSlice, CreateSliceProps } from '@ors/types/store'

import { produce } from 'immer'

export const createBPTypeSlice = ({ set }: CreateSliceProps): BPTypeSlice => ({
  bpType: '',
  setBPType: (type: string) =>
    set(
      produce((state) => {
        state.bpType.bpType = type
      }),
    ),
  uploadBpType: '',
  setUploadBPType: (type: string) =>
    set(
      produce((state) => {
        state.bpType.uploadBpType = type
      }),
    ),
})
