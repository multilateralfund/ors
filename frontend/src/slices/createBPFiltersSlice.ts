import type { CreateSliceProps } from '@ors/types/store'
import type { BPFiltersSlice, BPFiltersType } from '@ors/types/store'

import { setSlice } from '@ors/helpers/Store/Store'

export const createBPFiltersSlice = ({
  initialState,
}: CreateSliceProps): BPFiltersSlice => {
  const initialFilters: BPFiltersType = {
    range: '',
  }

  return {
    bpFilters: initialFilters,
    setBPFilters: (newFilters: Partial<BPFiltersType>) => {
      setSlice('bpFilters.bpFilters', newFilters)
    },
  }
}
