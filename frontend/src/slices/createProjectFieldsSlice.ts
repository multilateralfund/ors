import { defaultSliceData } from './createYearRangesSlice'
import type { CreateSliceProps, ProjectsFieldsSlice } from '@ors/types/store'
import { fetchSliceData } from '@ors/helpers/Store/Store'

import { filter } from 'lodash'

export const createProjectFieldsSlice = ({
  get,
  set,
}: CreateSliceProps): ProjectsFieldsSlice => {
  return {
    projectFields: defaultSliceData,
    getEditableFields: (version: number) => {
      const fields = get().projectFields.projectFields?.data ?? []

      return filter(fields, ({ editable_in_versions }) =>
        editable_in_versions?.includes(version),
      )
    },
    getViewableFields: (version: number) => {
      const fields = get().projectFields.projectFields?.data ?? []

      return filter(fields, ({ visible_in_versions }) =>
        visible_in_versions?.includes(version),
      )
    },
    fetchProjectFields: async () => {
      const fields = await fetchSliceData({
        apiSettings: { path: 'api/project-fields/' },
        slice: 'projectFields.projectFields',
      })

      set({ projectFields: fields })
    },
  }
}
