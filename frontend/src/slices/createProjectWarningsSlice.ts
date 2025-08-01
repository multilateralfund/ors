import type {
  CreateSliceProps,
  ProjectWarningsTypeSlice,
  ProjectWarningsType,
} from '@ors/types/store'

import { produce } from 'immer'

export const createProjectWarningsSlice = ({
  set,
}: CreateSliceProps): ProjectWarningsTypeSlice => ({
  warnings: { id: null, warnings: [] },
  setWarnings: (warnings: ProjectWarningsType) =>
    set(
      produce((state) => {
        state.projectWarnings.warnings = warnings
      }),
    ),
})
