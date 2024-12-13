import type { BPErrorsSlice, CreateSliceProps } from '@ors/types/store'

import { produce } from 'immer'

export const createBPErrorsSlice = ({
  set,
}: CreateSliceProps): BPErrorsSlice => ({
  generalErrors: [],
  setGeneralErrors: (errors: []) =>
    set(
      produce((state) => {
        state.bpErrors.generalErrors = errors
      }),
    ),
  rowErrors: [],
  setRowErrors: (errors: []) =>
    set(
      produce((state) => {
        state.bpErrors.rowErrors = errors
      }),
    ),
})
