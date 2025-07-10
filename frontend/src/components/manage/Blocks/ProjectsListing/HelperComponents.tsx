import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import {
  HeaderTag,
  VersionsDropdown,
} from './ProjectVersions/ProjectVersionsComponents'
import { ProjectTypeApi, RelatedProjectsType } from './interfaces'

import { Button, CircularProgress, Divider } from '@mui/material'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { IoReturnUpBack } from 'react-icons/io5'
import { SlReload } from 'react-icons/sl'
import { lowerCase, map } from 'lodash'
import cx from 'classnames'

type ButtonProps = {
  title: string
  onSubmit: () => void
  isDisabled?: boolean
  className?: string
}

export const SubmitButton = ({
  title,
  onSubmit,
  isDisabled = false,
  className,
}: ButtonProps) => (
  <Button
    className={cx(className, 'mr-0 h-10 px-3 py-1', {
      'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
        !isDisabled,
    })}
    size="large"
    variant="contained"
    onClick={onSubmit}
    disabled={isDisabled}
  >
    {title}
  </Button>
)

export const IncreaseVersionButton = ({
  title,
  onSubmit,
  isDisabled = false,
}: ButtonProps) => (
  <Button
    className={cx('px-4 py-2', {
      'bg-primary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
        !isDisabled,
    })}
    size="large"
    variant="contained"
    onClick={onSubmit}
    disabled={isDisabled}
  >
    {title}
  </Button>
)

export const RedirectBackButton = () => (
  <div className="w-fit">
    <Link className="text-black no-underline" href="/projects-listing">
      <div className="mb-3 flex items-center gap-2 text-lg uppercase tracking-[0.05em]">
        <IoReturnUpBack size={18} />
        IA/BA Portal
      </div>
    </Link>
  </div>
)

export const CancelButton = ({ onClick }: { onClick: any }) => (
  <Button
    className="h-10 border border-solid border-[#F2F2F2] bg-[#F2F2F2] px-4 py-2 leading-none text-[#4D4D4D] shadow-none hover:border-primary hover:bg-[#F2F2F2] hover:text-[#4D4D4D]"
    color="primary"
    size="large"
    variant="contained"
    onClick={onClick}
  >
    Cancel
  </Button>
)

export const PageTitle = ({
  pageTitle,
  projectTitle,
  project,
}: {
  pageTitle: string
  projectTitle: string
  project?: ProjectTypeApi
}) => {
  const { submission_status, code, code_legacy } = project || {}

  return (
    <>
      <span className="font-medium text-[#4D4D4D]">{pageTitle}: </span>
      <span>
        {projectTitle ?? 'New project'}
        {submission_status === 'Approved' ? `, ${code ?? code_legacy}` : ''}
      </span>
    </>
  )
}

export const ProjectStatusInfo = ({ project }: { project: ProjectTypeApi }) => (
  <div className="mt-4 flex flex-wrap gap-3">
    <div className="flex items-center gap-3">
      <span>Submission status:</span>
      <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
        {project.submission_status}
      </span>
    </div>

    <span>|</span>

    <div className="flex items-center gap-3">
      <span>Project status:</span>
      <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
        {project.status}
      </span>
    </div>
  </div>
)

export const VersionsList = ({
  project,
  showVersionsMenu,
  setShowVersionsMenu,
}: {
  project: ProjectTypeApi
  showVersionsMenu: boolean
  setShowVersionsMenu: Dispatch<SetStateAction<boolean>>
}) => {
  const {
    versions = [],
    version = 0,
    latest_project = null,
    submission_status,
  } = project
  const isDraft = lowerCase(submission_status) === 'draft'

  return (
    (!isDraft || (isDraft && version === 2)) && (
      <>
        <VersionsDropdown
          {...{ versions, showVersionsMenu, setShowVersionsMenu }}
        />
        <HeaderTag {...{ latest_project, version }} />
      </>
    )
  )
}

export const ErrorTag = () => (
  <div className="h-[17px] rounded bg-[#801F00] p-1 pt-0.5 text-sm leading-none text-white">
    Incomplete
  </div>
)

export const RelatedProjects = ({
  data,
  getErrors,
  isLoaded,
  canRefreshStatus = true,
}: {
  data?: RelatedProjectsType[]
  getErrors?: () => void
  isLoaded?: boolean
  canRefreshStatus?: boolean
}) => (
  <div className="flex flex-col">
    {map(data, (entry) => {
      const hasErrors = entry.errors.length > 0

      return (
        <div key={entry.id}>
          <Link
            component="a"
            className={cx(
              'flex items-center gap-2 text-lg normal-case leading-tight no-underline',
              {
                '!text-inherit': !hasErrors,
                '!text-[#801F00]': hasErrors,
              },
            )}
            href={`/projects-listing/${entry.id}/edit`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e: React.SyntheticEvent) => e.stopPropagation()}
          >
            <FaExternalLinkAlt
              size={16}
              className="min-h-[16px] min-w-[16px]"
            />
            {entry.title}
            {hasErrors && <ErrorTag />}
          </Link>
          <Divider className="my-3" />
        </div>
      )
    })}
    {canRefreshStatus && (
      <div className="mt-4 flex items-center gap-2">
        <div
          className="flex cursor-pointer items-center gap-2 text-lg normal-case leading-none"
          onClick={() => {
            if (getErrors) {
              getErrors()
            }
          }}
        >
          <SlReload />
          Refresh status
        </div>
        {!isLoaded && (
          <CircularProgress color="inherit" size="16px" className="ml-1.5" />
        )}
      </div>
    )}
  </div>
)
