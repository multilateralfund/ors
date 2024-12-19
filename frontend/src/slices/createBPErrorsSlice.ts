import type {
  BPErrorsSlice,
  CreateSliceProps,
  ErrorTemplate,
} from '@ors/types/store'

import { produce } from 'immer'

export const createBPErrorsSlice = ({
  set,
}: CreateSliceProps): BPErrorsSlice => ({
  rowErrors: [],
  setRowErrors: (errors: ErrorTemplate[]) =>
    set(
      produce((state) => {
        state.bpErrors.rowErrors = errors
      }),
    ),
})
