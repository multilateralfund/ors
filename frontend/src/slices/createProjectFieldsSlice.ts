import { defaultSliceData } from './createYearRangesSlice'
import type { CreateSliceProps, ProjectsFieldsSlice } from '@ors/types/store'
import { fetchSliceData } from '@ors/helpers/Store/Store'

import { filter } from 'lodash'
import { produce } from 'immer'

export const createProjectFieldsSlice = ({
  get,
  set,
}: CreateSliceProps): ProjectsFieldsSlice => {
  return {
    projectFields: defaultSliceData,
    viewableFields: [],
    editableFields: [],
    setViewableFields: (version: number) => {
      const fields = get().projectFields.projectFields?.data ?? []

      const viewableFields = filter(fields, ({ visible_in_versions }) =>
        visible_in_versions?.includes(version),
      ).map((field) => field.write_field_name)

      set(
        produce((state) => {
          state.projectFields.viewableFields = viewableFields
        }),
      )
    },
    setEditableFields: (version: number, submissionStatus?: string) => {
      const fields = get().projectFields.projectFields?.data ?? []

      const editableFields = filter(
        fields,
        ({ editable_in_versions, is_actual, section }) =>
          editable_in_versions?.includes(version) &&
          (section !== 'Impact' ||
            submissionStatus !== 'Approved' ||
            is_actual),
      ).map((field) => field.write_field_name)

      set(
        produce((state) => {
          state.projectFields.editableFields = editableFields
        }),
      )
    },
    fetchProjectFields: async () => {
      const fields = await fetchSliceData({
        apiSettings: { path: 'api/project-fields/' },
        slice: 'projectFields.projectFields',
      })

      set(
        produce((state) => {
          state.projectFields.projectFields = fields
        }),
      )
    },
  }
}
