import React from 'react'

import { NavigationButton } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { canViewField } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  ProjectTabSetters,
  ProjectSpecificFields,
} from '../interfaces'
import { useStore } from '@ors/store'

import { chunk, find } from 'lodash'
import cx from 'classnames'

const ProjectImpact = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  setCurrentTab,
  nextStep,
}: SpecificFieldsSectionProps & ProjectTabSetters & { nextStep: number }) => {
  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const ImpactFields = (fields: ProjectSpecificFields[]) =>
    fields.map((field, i) => (
      <React.Fragment key={i}>
        {canViewField(viewableFields, field.write_field_name) &&
          widgets[field.data_type]<ProjectData>(
            projectData,
            setProjectData,
            field,
            errors,
            editableFields,
          )}
      </React.Fragment>
    ))

  return (
    <>
      <div className="grid w-3/4 grid-cols-1 flex-wrap gap-x-20 gap-y-2 md:grid-cols-2">
        {find(sectionFields, (field) => field.is_actual)
          ? chunk(sectionFields, 2).map((group, i) => (
              <div
                key={i}
                className={cx('flex flex-col gap-y-2', {
                  'w-full md:col-span-2': group[0].data_type === 'boolean',
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
          setCurrentTab={setCurrentTab}
        />
        <NavigationButton {...{ setCurrentTab }} />
      </div>
    </>
  )
}

export default ProjectImpact
