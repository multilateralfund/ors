import { ProjectSpecificFields } from '@ors/components/manage/Blocks/ProjectsListing/interfaces'
import { formatFieldLabel } from '@ors/components/manage/Blocks/ProjectsListing/utils'
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

      const viewableFields = filter(fields, ({ visible_in_versions }) => {
        const versionCheck = version >= 3 ? 3 : version
        return (
          visible_in_versions?.includes(versionCheck) &&
          (submissionStatus !== 'Draft' || visible_in_versions.includes(1))
        )
      }).map((field) => field.write_field_name)

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
      isPostExcom?: boolean,
      mode?: string,
    ) => {
      const fields = get().projectFields.projectFields?.data ?? []
      const isAfterApproval = ['Approved', 'Not approved'].includes(
        submissionStatus ?? '',
      )

      const editableFields = fields
        .filter(
          ({ editable_in_versions, is_actual, section, write_field_name }) => {
            const isFieldNotV3Editable = ['bp_activity'].includes(
              write_field_name,
            )

            if (!isFieldNotV3Editable) {
              if (
                !isPostExcom &&
                mode === 'edit' &&
                submissionStatus === 'Approved'
              ) {
                return canEditAll
                  ? section !== 'Approval' &&
                      (section !== 'Impact' || is_actual)
                  : is_actual
              }

              if (
                isPostExcom ||
                (canEditAll &&
                  mode === 'edit' &&
                  submissionStatus === 'Not approved')
              ) {
                return section !== 'Approval'
              }
            }

            const isEditableInVersion = editable_in_versions?.includes(version)
            const isFieldEditable =
              section !== 'Impact' || !isAfterApproval || is_actual
            const isDraftEditable =
              submissionStatus !== 'Draft' || editable_in_versions?.includes(1)
            const isEditableByStatus = submissionStatus !== 'Withdrawn'
            const canEditField =
              isEditableInVersion &&
              isFieldEditable &&
              isDraftEditable &&
              isEditableByStatus

            return !isFieldNotV3Editable
              ? canEditAll || canEditField
              : canEditField
          },
        )
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
          const formattedFields = (fields || []).map(
            (field: ProjectSpecificFields) => ({
              ...field,
              label: formatFieldLabel(field.label),
            }),
          )
          state.projectFields.projectFields = formattedFields
        }),
      )
    },
  }
}
