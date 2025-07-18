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

      const editableFields = fields
        .filter(({ editable_in_versions, is_actual, section }) => {
          const isEditableInVersion = editable_in_versions?.includes(version)
          const areActualFieldsEditable =
            section !== 'Impact' || submissionStatus !== 'Approved' || is_actual
          const isDraftEditable =
            submissionStatus !== 'Draft' || editable_in_versions?.includes(1)
          const isVersion3Editable = version === 3 && canEditAll
          const isWithdrawnEditable =
            submissionStatus === 'Withdrawn' && canEditAll

          return (
            (isEditableInVersion &&
              areActualFieldsEditable &&
              isDraftEditable) ||
            isVersion3Editable ||
            isWithdrawnEditable
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
