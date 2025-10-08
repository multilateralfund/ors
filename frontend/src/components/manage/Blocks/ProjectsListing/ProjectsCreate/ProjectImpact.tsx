import { useMemo } from 'react'

import { NavigationButton } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { canViewField } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  ProjectTabSetters,
  ProjectSpecificFields,
  ProjectTypeApi,
} from '../interfaces'
import { useStore } from '@ors/store'

import { chunk, find, isArray, isNull } from 'lodash'
import cx from 'classnames'

const ProjectImpact = ({
  projectData,
  setProjectData,
  project,
  sectionFields,
  errors = {},
  hasSubmitted,
  setCurrentTab,
  postExComUpdate,
  nextStep,
  hasV3EditPermissions,
}: SpecificFieldsSectionProps &
  ProjectTabSetters & {
    project?: ProjectTypeApi
    postExComUpdate: boolean
    nextStep: number
    hasV3EditPermissions: boolean
  }) => {
  const { viewableFields, editableFields, projectFields } = useStore(
    (state) => state.projectFields,
  )
  const filteredEditableFields = editableFields.filter((field) => {
    const allFields = isArray(projectFields)
      ? projectFields
      : projectFields?.data

    const fieldData = allFields.find(
      (projField) => projField.write_field_name === field,
    )

    if (!postExComUpdate) {
      if (
        hasV3EditPermissions &&
        project?.submission_status === 'Approved' &&
        fieldData &&
        fieldData.section === 'Impact' &&
        !fieldData.is_actual
      ) {
        return isNull(project[field as keyof ProjectTypeApi])
      } else {
        return true
      }
    }

    return fieldData && (fieldData.section !== 'Impact' || fieldData.is_actual)
  })

  const ImpactFields = useMemo(() => {
    return (fields: ProjectSpecificFields[]) =>
      fields.map(
        (field) =>
          canViewField(viewableFields, field.write_field_name) &&
          widgets[field.data_type]<ProjectData>(
            projectData,
            setProjectData,
            field,
            errors,
            false,
            hasSubmitted,
            filteredEditableFields,
          ),
      )
  }, [filteredEditableFields])

  return (
    <>
      <div className="flex w-3/4 grid-cols-2 flex-wrap gap-x-20 gap-y-2 md:grid">
        {find(sectionFields, (field) => field.is_actual)
          ? chunk(sectionFields, 2).map((group, i) => (
              <div
                key={i}
                className={cx('flex flex-col gap-y-2', {
                  'col-span-2 w-full': group[0].data_type === 'boolean',
                })}
              >
                {ImpactFields(group)}
              </div>
            ))
          : ImpactFields(sectionFields)}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton
          nextTab={nextStep - 1}
          type="previous"
          {...{ nextStep, setCurrentTab }}
        />
        <NavigationButton {...{ setCurrentTab }} />
      </div>
    </>
  )
}

export default ProjectImpact
