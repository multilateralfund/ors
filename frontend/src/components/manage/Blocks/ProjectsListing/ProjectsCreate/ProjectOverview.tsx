import { useEffect, useState } from 'react'

import { widgets } from './SpecificFieldsHelpers'
import { ErrorTag } from '../HelperComponents'
import {
  SpecificFieldsSectionProps,
  ProjectData,
  TrancheErrors,
} from '../interfaces'
import { api } from '@ors/helpers'

import { IoChevronDown, IoChevronUp } from 'react-icons/io5'
import { enqueueSnackbar } from 'notistack'
import { useParams } from 'wouter'
import cx from 'classnames'

const ProjectOverview = ({
  projectData,
  setProjectData,
  sectionFields,
  errors = {},
  hasSubmitted,
  trancheErrors,
  setTrancheErrors,
}: SpecificFieldsSectionProps & TrancheErrors) => {
  const { project_id } = useParams<Record<string, string>>()
  const { errorText, isError } = trancheErrors

  const [open, setOpen] = useState(false)
  const [tranchesUrls, setTranchesUrls] = useState([])

  const tranche = projectData.projectSpecificFields?.tranche ?? 0

  useEffect(() => {
    const getTrancheErrors = async () => {
      setTrancheErrors({ errorText: '', isError: false })

      try {
        const result = await api(
          `api/projects/v2/${project_id}/list_previous_tranches/`,
          {
            withStoreCache: false,
          },
          false,
        )

        console.log(result)

        if (result.length === 0) {
          setTrancheErrors({
            errorText:
              'A new tranche cannot be created unless a previous one exists.',
            isError: true,
          })
        } else {
          // setTranchesUrls(result)
          // setTrancheErrors('')
        }
      } catch (error) {
        enqueueSnackbar(
          <>
            An error occurred during previous tranches validation. Please try
            again.
          </>,
          {
            variant: 'error',
          },
        )
      }
    }

    if (!project_id || tranche <= 1) {
      setTrancheErrors({ errorText: '', isError: false })
    } else {
      getTrancheErrors()
    }
  }, [tranche])

  function OpenActivity({ activity, gridOptions }: any) {
    const isRemarksView = gridOptions === 'remarks'
    const isAllView = gridOptions === 'all' || !gridOptions

    return (
      <div className="transition-opacity flex w-full flex-col gap-4 opacity-100 duration-300 ease-in-out">
        <h4 className="m-0 flex items-center gap-4 border-0 border-b border-solid border-primary pb-4">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
            <IoChevronUp className="text-primary" size={14} />
          </div>
          {activity.title}
        </h4>
        <div
          className={cx(
            'grid grid-cols-2 gap-y-4 border-0 pb-4 md:grid-cols-3 lg:grid-cols-4',
            {
              'border-b border-solid border-gray-200':
                isAllView || isRemarksView,
            },
          )}
        >
          <span className="flex items-center gap-2"></span>
        </div>
      </div>
    )
  }

  const ClosedTrancheError = () => (
    <div className="transition-opacity flex items-center justify-between gap-2 opacity-100 duration-300 ease-in-out">
      <div className="flex flex-row items-center gap-2.5">
        <span>Previous tranche information</span>
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
          {open ? <OpenActivity /> : <ClosedTrancheError />}
        </div>
      )}
    </>
  )
}

export default ProjectOverview
