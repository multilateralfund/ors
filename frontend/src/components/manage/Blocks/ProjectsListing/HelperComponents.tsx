import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import {
  HeaderTag,
  VersionsDropdown,
} from './ProjectVersions/ProjectVersionsComponents'
import { ProjectTypeApi } from './interfaces'

import { IoReturnUpBack } from 'react-icons/io5'
import { Button } from '@mui/material'
import { lowerCase } from 'lodash'
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

export const PageTitle = ({
  pageTitle,
  projectTitle,
  project,
}: {
  pageTitle: string
  projectTitle: string
  project: ProjectTypeApi
}) => {
  const { submission_status, code, code_legacy } = project

  return (
    <div className="flex gap-2.5">
      <span className="whitespace-nowrap font-medium text-[#4D4D4D]">
        {pageTitle}:
      </span>
      <div>
        {projectTitle ?? 'New project'}
        {submission_status === 'Approved' ? `, ${code ?? code_legacy}` : ''}
      </div>
    </div>
  )
}

export const ProjectStatusInfo = ({ project }: { project: ProjectTypeApi }) => (
  <div className="mt-4 flex gap-3">
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

  return (
    (version > 1 || lowerCase(submission_status) !== 'draft') && (
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
