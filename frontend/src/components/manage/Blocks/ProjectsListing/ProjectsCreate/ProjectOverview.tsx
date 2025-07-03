import React, { useState } from 'react'

import Link from '@ors/components/ui/Link/Link'
import ErrorAlert from '@ors/components/theme/Alerts/ErrorAlert'
import { widgets } from './SpecificFieldsHelpers'
import { ErrorTag } from '../HelperComponents'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  TrancheErrors,
  TrancheDataType,
} from '../interfaces'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
import { Typography, Divider } from '@mui/material'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { SlReload } from 'react-icons/sl'
import { map } from 'lodash'
import cx from 'classnames'

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

  const { errorText, isError, tranchesData } = trancheErrors || {}
  const tranche = projectData.projectSpecificFields?.tranche ?? 0

  const OpenedTrancheError = () => (
    <div className="transition-opacity flex flex-col gap-6 opacity-100 duration-300 ease-in-out">
      <div className="flex items-center justify-between gap-2 text-lg">
        <span>Previous tranche information</span>
        <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
          <IoChevronUp className="text-primary" size={14} />
        </div>
      </div>
      <ErrorAlert
        content={
          <Typography className="text-lg leading-none">
            Please complete the previous tranche's impact indicators before
            submitting this project.
          </Typography>
        }
      />
      <div className="flex flex-col">
        {map(tranchesData, (tranche: TrancheDataType) => {
          const hasErrors = tranche.errors.length > 0

          return (
            <div key={tranche.id}>
              <Link
                component="a"
                className={cx(
                  'flex items-center gap-2 text-lg normal-case leading-tight !text-inherit no-underline',
                  { '!text-[#801F00]': hasErrors },
                )}
                href={`/projects-listing/${tranche.id}/edit`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={(e: React.SyntheticEvent) => e.stopPropagation()}
              >
                <FaExternalLinkAlt
                  size={16}
                  className="min-h-[16px] min-w-[16px]"
                />
                {tranche.title}
                {hasErrors && <ErrorTag />}
              </Link>
              <Divider className="my-3" />
            </div>
          )
        })}
        <div
          className="mt-4 flex items-center gap-2 text-lg normal-case leading-none"
          onClick={() => {
            if (getTrancheErrors) {
              getTrancheErrors()
            }
          }}
        >
          <SlReload />
          Refresh status
        </div>
      </div>
    </div>
  )

  const ClosedTrancheError = () => (
    <div className="transition-opacity flex items-center justify-between gap-2 opacity-100 duration-300 ease-in-out">
      <div className="flex flex-row items-center gap-2.5 text-lg">
        <span className="leading-none">Previous tranche information</span>
        <ErrorTag />
      </div>
      <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
        <IoChevronDown className="text-primary" size={14} />
      </div>
    </div>
  )

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-5">
        {sectionFields.map((field) =>
          widgets[field.data_type]<ProjectData>(
            projectData,
            setProjectData,
            field,
            errors,
            !!errorText,
            hasSubmitted,
          ),
        )}
      </div>
      {tranche > 1 && errorText && !isError && (
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
