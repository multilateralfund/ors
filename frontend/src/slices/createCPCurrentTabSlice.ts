import type { CPCurrentTabSlice } from '@ors/types/store'

import { produce } from 'immer'

import { CreateSliceProps } from '@ors/store'

export const createCPCurrentTabSlice = ({
  set,
}: CreateSliceProps): CPCurrentTabSlice => ({
  activeTab: 0,
  setActiveTab: (nr: number) =>
    set(
      produce((state) => {
        state.cp_current_tab.activeTab = nr
      }),
    ),
})
