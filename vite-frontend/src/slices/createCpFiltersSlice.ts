import type { CreateSliceProps } from '@ors/types/store'
import type { FiltersSlice, FiltersType } from '@ors/types/store'

import { setSlice } from '@ors/helpers/Store/Store'

export const createFiltersSlice = ({
  initialState,
}: CreateSliceProps): FiltersSlice => {
  const initialFilters: FiltersType = {
    country: [],
    range: [],
    status: 'all',
  }

  return {
    filters: initialFilters,
    setFilters: (newFilters: Partial<FiltersType>) => {
      setSlice('filters.filters', newFilters)
    },
  }
}
