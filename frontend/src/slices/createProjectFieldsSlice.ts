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
    setViewableFields: (version: number, submissionStatus?: string) => {
      const fields = get().projectFields.projectFields?.data ?? []

      const viewableFields = filter(
        fields,
        ({ visible_in_versions }) =>
          visible_in_versions?.includes(version) &&
          (submissionStatus !== 'Draft' || visible_in_versions.includes(1)),
      ).map((field) => field.write_field_name)

      set(
        produce((state) => {
          state.projectFields.viewableFields = viewableFields
        }),
      )
    },
    setEditableFields: (
      version: number,
      submissionStatus?: string,
      canEditAll?: boolean,
    ) => {
      const fields = get().projectFields.projectFields?.data ?? []
      const isAfterApproval = ['Approved', 'Not approved'].includes(
        submissionStatus ?? '',
      )

      const editableFields = fields
        .filter(({ editable_in_versions, is_actual, section }) => {
          const isEditableInVersion = editable_in_versions?.includes(version)
          const isFieldEditable =
            section !== 'Impact' || !isAfterApproval || is_actual
          const isDraftEditable =
            submissionStatus !== 'Draft' || editable_in_versions?.includes(1)
          const isEditableByStatus = submissionStatus !== 'Withdrawn'

          return (
            canEditAll ||
            (isEditableInVersion &&
              isFieldEditable &&
              isDraftEditable &&
              isEditableByStatus)
          )
        })
        .map((field) => field.write_field_name)

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
