import type { BPDiffVersionsSlice, CreateSliceProps } from '@ors/types/store'

import { produce } from 'immer'

export const createBPDiffVersionsSlice = ({
  set,
}: CreateSliceProps): BPDiffVersionsSlice => ({
  currentVersion: 0,
  previousVersion: 0,
  setCurrentVersion: (version: number) =>
    set(
      produce((state) => {
        state.bp_diff_versions.currentVersion = version
      }),
    ),
  setPreviousVersion: (version: number) =>
    set(
      produce((state) => {
        state.bp_diff_versions.previousVersion = version
      }),
    ),
})
