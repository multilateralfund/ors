import type { ProjectsSlice } from '@ors/types/store'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { CreateSliceProps } from '@ors/store'

export const createProjectSlice = ({
  initialState,
}: CreateSliceProps): ProjectsSlice => {
  return {
    clusters: {
      ...defaultSliceData,
      ...(initialState?.projects?.clusters || {}),
    },
    meetings: {
      ...defaultSliceData,
      ...(initialState?.projects?.meetings || {}),
    },
    sectors: {
      ...defaultSliceData,
      ...(initialState?.projects?.sectors || {}),
    },
    statuses: {
      ...defaultSliceData,
      ...(initialState?.projects?.statuses || {}),
    },
    subsectors: {
      ...defaultSliceData,
      ...(initialState?.projects?.subsectors || {}),
    },
    types: {
      ...defaultSliceData,
      ...(initialState?.projects?.types || {}),
    },
  }
}
