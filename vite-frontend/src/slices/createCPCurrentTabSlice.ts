import type { CreateSliceProps } from '@ors/types/store'
import type { CPCurrentTabSlice } from '@ors/types/store'

import { produce } from 'immer'

export const createCPCurrentTabSlice = ({
  set,
}: CreateSliceProps): CPCurrentTabSlice => ({
  activeTab: 0,
  diffActiveTab: 0,
  setActiveTab: (nr: number) =>
    set(
      produce((state) => {
        state.cp_current_tab.activeTab = nr
      }),
    ),
  setDiffActiveTab: (nr: number) =>
    set(
      produce((state) => {
        state.cp_current_tab.activeTab = nr + 1
        state.cp_current_tab.diffActiveTab = nr
      }),
    ),
})
