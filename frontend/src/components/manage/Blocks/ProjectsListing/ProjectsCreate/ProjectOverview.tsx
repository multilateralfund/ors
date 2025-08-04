import { useState } from 'react'

import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import { ClosedList, OpenedList } from '../HelperComponents'
import { widgets } from './SpecificFieldsHelpers'
import { canViewField } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  TrancheErrors,
} from '../interfaces'
import { useStore } from '@ors/store'

import { Typography } from '@mui/material'

const ProjectOverview = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
  trancheErrors,
  getTrancheErrors,
}: SpecificFieldsSectionProps & TrancheErrors) => {
  const [open, setOpen] = useState(false)

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const { errorText, isError, tranchesData = [], loaded } = trancheErrors || {}
  const tranche = projectData.projectSpecificFields?.tranche ?? 0

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-5">
        {sectionFields.map(
          (field) =>
            canViewField(viewableFields, field.write_field_name) &&
            widgets[field.data_type]<ProjectData>(
              projectData,
              setProjectData,
              field,
              errors,
              !!errorText,
              hasSubmitted,
              editableFields,
            ),
        )}
      </div>
      {tranche > 1 && tranchesData.length > 0 && !isError && (
        <div
          className="transition-transform mt-6 w-full max-w-[850px] transform cursor-pointer rounded-lg p-4 duration-300 ease-in-out"
          style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <OpenedList
              title="Previous tranche information"
              data={tranchesData}
              errorAlert={
                <CustomAlert
                  type="error"
                  content={
                    <Typography className="text-lg leading-none">
                      Please complete the previous tranche's impact indicators
                      before submitting this project.
                    </Typography>
                  }
                />
              }
              {...{
                errorText,
                getTrancheErrors,
                loaded,
              }}
            />
          ) : (
            <ClosedList
              title="Previous tranche information"
              errorText={errorText}
            />
          )}
        </div>
      )}
    </>
  )
}

export default ProjectOverview
