import { widgets } from './SpecificFieldsHelpers'
import { NextButton } from '../HelperComponents'
import { canViewField } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  ProjectTabSetters,
} from '../interfaces'
import { useStore } from '@ors/store'

import { isArray } from 'lodash'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
  setCurrentStep,
  setCurrentTab,
  postExComUpdate,
  nextStep,
}: SpecificFieldsSectionProps &
  ProjectTabSetters & {
    postExComUpdate: boolean
    nextStep: number
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
        />
        <NextButton
          nextStep={nextStep}
          nextTab={nextStep - 1}
          type="previous"
          setCurrentTab={setCurrentTab}
        />
      </div>
    </>
  )
}

export default ProjectImpact
