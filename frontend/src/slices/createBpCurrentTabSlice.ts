import type { CreateSliceProps } from '@ors/types/store'
import type { BPCurrentTabSlice } from '@ors/types/store'

import { produce } from 'immer'

export const createBpCurrentTabSlice = ({
  set,
}: CreateSliceProps): BPCurrentTabSlice => ({
  activeTab: 0,
  setActiveTab: (nr: number) =>
    set(
      produce((state) => {
        state.bp_current_tab.activeTab = nr
      }),
    ),
})
