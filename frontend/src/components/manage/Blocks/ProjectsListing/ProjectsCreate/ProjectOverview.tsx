import { useState } from 'react'

import ErrorAlert from '@ors/components/theme/Alerts/ErrorAlert'
import { widgets } from './SpecificFieldsHelpers'
import { ErrorTag, RelatedProjects } from '../HelperComponents'
import { canViewField } from '../utils'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  TrancheErrors,
} from '../interfaces'
import { useStore } from '@ors/store'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
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

  const { errorText, isError, tranchesData, loaded, shouldDisplaySection } =
    trancheErrors || {}
  const tranche = projectData.projectSpecificFields?.tranche ?? 0

  const OpenedTrancheError = () => (
    <div className="transition-opacity flex flex-col gap-6 opacity-100 duration-300 ease-in-out">
      <div className="flex items-center justify-between gap-2 text-lg">
        <span>Previous tranche information</span>
        <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
          <IoChevronUp className="text-primary" size={14} />
        </div>
      </div>
      {errorText && (
        <ErrorAlert
          content={
            <Typography className="text-lg leading-none">
              Please complete the previous tranche's impact indicators before
              submitting this project.
            </Typography>
          }
        />
      )}
      <RelatedProjects
        data={tranchesData}
        getErrors={getTrancheErrors}
        isLoaded={loaded}
      />
    </div>
  )

  const ClosedTrancheError = () => (
    <div className="transition-opacity flex items-center justify-between gap-2 opacity-100 duration-300 ease-in-out">
      <div className="flex flex-row items-center gap-2.5 text-lg">
        <span className="leading-none">Previous tranche information</span>
        {errorText && <ErrorTag />}
      </div>
      <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
        <IoChevronDown className="text-primary" size={14} />
      </div>
    </div>
  )

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
      {tranche > 1 && shouldDisplaySection && !isError && (
        <div
          className="transition-transform mt-6 w-full max-w-[850px] transform cursor-pointer rounded-lg p-4 duration-300 ease-in-out"
          style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
          onClick={() => setOpen(!open)}
        >
          {open ? <OpenedTrancheError /> : <ClosedTrancheError />}
        </div>
      )}
    </>
  )
}

export default ProjectOverview
