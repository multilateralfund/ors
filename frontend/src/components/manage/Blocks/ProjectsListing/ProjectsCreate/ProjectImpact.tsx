import { widgets } from './SpecificFieldsHelpers'
import { NextButton } from '../HelperComponents'
import { canViewField, getDefaultImpactErrors } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  ProjectTabSetters,
  ProjectSpecificFields,
} from '../interfaces'
import { useStore } from '@ors/store'

import { isArray } from 'lodash'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
  specificFields,
  setCurrentStep,
  setCurrentTab,
  postExComUpdate,
}: SpecificFieldsSectionProps &
  ProjectTabSetters & {
    specificFields: ProjectSpecificFields[]
    postExComUpdate: boolean
  }) => {
  const { viewableFields, editableFields, projectFields } = useStore(
    (state) => state.projectFields,
  )
  const filteredEditableFields = editableFields.filter((field) => {
    if (!postExComUpdate) {
      return true
    }

    const allFields = isArray(projectFields)
      ? projectFields
      : projectFields?.data

    const fieldData = allFields.find(
      (projField) => projField.write_field_name === field,
    )

    return fieldData && (fieldData.section !== 'Impact' || fieldData.is_actual)
  })

  const { projectSpecificFields } = projectData
  const defaultImpactErrors = getDefaultImpactErrors(
    projectSpecificFields,
    specificFields,
  )

  const hasErrors = Object.values(defaultImpactErrors).some(
    (errors) => errors.length > 0,
  )

  return (
    <>
      <div className="flex w-[50%] grid-cols-2 flex-wrap gap-x-20 gap-y-3 md:grid md:w-auto lg:grid-cols-4">
        {sectionFields.map(
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
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NextButton
          nextStep={5}
          setCurrentStep={setCurrentStep}
          setCurrentTab={setCurrentTab}
          isBtnDisabled={hasErrors}
        />
      </div>
    </>
  )
}

export default ProjectImpact
