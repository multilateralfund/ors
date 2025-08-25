import type { CreateSliceProps } from '@ors/types/store'
import type { ProjectsSlice } from '@ors/types/store'

import { defaultSliceData, setSlice } from '@ors/helpers/Store/Store'

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
    setProjectSettings: (project_settings) => {
      setSlice('projects.project_settings', project_settings)
    },
    project_settings: {
      ...defaultSliceData,
      ...(initialState?.projects?.project_settings || {}),
    },
    sectors: {
      ...defaultSliceData,
      ...(initialState?.projects?.sectors || {}),
    },
    statuses: {
      ...defaultSliceData,
      ...(initialState?.projects?.statuses || {}),
    },
    submission_statuses: {
      ...defaultSliceData,
      ...(initialState?.projects?.submission_statuses || {}),
    },
    subsectors: {
      ...defaultSliceData,
      ...(initialState?.projects?.subsectors || {}),
    },
    types: {
      ...defaultSliceData,
      ...(initialState?.projects?.types || {}),
    },
    substances_groups: {
      ...defaultSliceData,
      ...(initialState?.projects?.substances_groups || {}),
    },
  }
}
