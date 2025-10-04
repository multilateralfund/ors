import { NavigationButton } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { canViewField } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  ProjectTabSetters,
  ProjectSpecificFields,
  SpecificFields,
} from '../interfaces'
import { useStore } from '@ors/store'

import { chunk, find, isArray, isNull } from 'lodash'
import cx from 'classnames'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
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

    return (
      fieldData &&
      (fieldData.section !== 'Impact' ||
        fieldData.is_actual ||
        isNull(
          projectData['projectSpecificFields'][field as keyof SpecificFields],
        ))
    )
  })

  const ImpactFields = ({ fields }: { fields: ProjectSpecificFields[] }) =>
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

  return (
    <>
      <div className="flex w-3/4 grid-cols-2 flex-wrap gap-x-20 gap-y-3 md:grid">
        {find(sectionFields, (field) => field.is_actual) ? (
          chunk(sectionFields, 2).map((group, i) => (
            <div
              key={i}
              className={cx('flex flex-col gap-y-3', {
                'col-span-2 w-full': group[0].data_type === 'boolean',
              })}
            >
              <ImpactFields fields={group} />
            </div>
          ))
        ) : (
          <ImpactFields fields={sectionFields} />
        )}
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
