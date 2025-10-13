import { Dispatch, ReactNode, SetStateAction } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import Link from '@ors/components/ui/Link/Link'
import {
  HeaderTag,
  VersionsDropdown,
} from './ProjectVersions/ProjectVersionsComponents'
import { enabledButtonClassname } from './constants'
import {
  ProjectTabSetters,
  ProjectTypeApi,
  RelatedProjectsType,
} from './interfaces'

import { filter, lowerCase, map, upperCase } from 'lodash'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { SlReload } from 'react-icons/sl'
import cx from 'classnames'
import {
  Button,
  CircularProgress,
  Divider,
  Typography,
  MenuProps,
  ButtonProps,
} from '@mui/material'
import {
  IoAlertCircle,
  IoChevronDown,
  IoChevronUp,
  IoClose,
  IoReturnUpBack,
} from 'react-icons/io5'

type CustomButtonProps = {
  title: string
  onSubmit: () => void
  isDisabled?: boolean
  className?: string
}

type NavigationButtonProps = {
  title: string
  href: string
  className?: string
}

export const CreateButton = ({
  title,
  href,
  className,
}: NavigationButtonProps) => (
  <CustomLink
    className={cx(
      'mb-4 h-10 min-w-[6.25rem] text-nowrap px-4 py-2 text-lg uppercase',
      className,
    )}
    href={href}
    color="secondary"
    variant="contained"
    button
  >
    {title}
  </CustomLink>
)

export const SubmitButton = ({
  title,
  onSubmit,
  isDisabled = false,
  className,
}: CustomButtonProps) => (
  <Button
    className={cx(
      className,
      'mr-0 border border-solid border-current px-3 py-1',
      {
        [enabledButtonClassname]: !isDisabled,
      },
    )}
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
}: CustomButtonProps) => (
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
    <Link className="text-black no-underline" href="/projects-listing/listing">
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

export const NavigationButton = ({
  nextStep,
  nextTab,
  setCurrentStep,
  setCurrentTab,
  type = 'next',
  isBtnDisabled = false,
}: ProjectTabSetters & {
  nextStep?: number
  nextTab?: number
  type?: string
  isBtnDisabled?: boolean
}) => {
  const moveToNextStep = () => {
    if (nextStep && setCurrentStep) {
      setCurrentStep(nextStep)
    }

    if (setCurrentTab) {
      setCurrentTab((tab) => nextTab ?? (type === 'next' ? tab + 1 : tab - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <Button
      className={cx('h-8 border px-3 py-1 leading-none', {
        'border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
          type === 'next' && !isBtnDisabled,
        'border-solid border-primary bg-white text-primary':
          type === 'previous',
      })}
      disabled={isBtnDisabled}
      size="large"
      variant="contained"
      onClick={moveToNextStep}
    >
      {upperCase(type)}
    </Button>
  )
}

export const PageTitle = ({
  pageTitle,
  projectTitle,
  project,
  className,
}: {
  pageTitle: string
  projectTitle: string
  project?: ProjectTypeApi
  className?: string
}) => {
  const { submission_status = '', code, code_legacy } = project || {}

  return (
    <>
      <span className="font-medium text-[#4D4D4D]">{pageTitle}: </span>
      <span className={className}>
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
    post_excom_meeting,
  } = project
  const isDraft = lowerCase(submission_status) === 'draft'
  let versionLabel
  if (version > 3) {
    versionLabel = `${version}: Updated after ExCom ${post_excom_meeting}`
  } else {
    versionLabel = `${version}: ${submission_status}`
  }

  return (
    (!isDraft || (isDraft && version === 2)) && (
      <>
        <VersionsDropdown
          {...{ versions, showVersionsMenu, setShowVersionsMenu }}
        />
        <HeaderTag {...{ latest_project, version: versionLabel }} />
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
  withExtraProjectInfo = false,
  canRefreshStatus = true,
  mode = 'edit',
}: {
  data?: RelatedProjectsType[]
  getErrors?: () => void
  isLoaded?: boolean
  withExtraProjectInfo?: boolean
  canRefreshStatus?: boolean
  mode?: string
}) => (
  <div className="flex flex-col">
    {map(data, (entry, index) => {
      const hasErrors = entry.errors.length > 0

      return (
        <div key={entry.id} className={cx({ 'py-3': withExtraProjectInfo })}>
          <Link
            component="a"
            className={cx(
              'flex w-fit items-center gap-2 text-lg normal-case leading-tight no-underline',
              {
                'pb-2.5': withExtraProjectInfo,
                '!text-inherit': !hasErrors,
                '!text-[#801F00]': hasErrors,
              },
            )}
            href={`/projects-listing/${entry.id}${mode === 'edit' ? '/edit' : ''}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e: React.SyntheticEvent) => e.stopPropagation()}
          >
            <FaExternalLinkAlt
              size={16}
              className="min-h-[16px] min-w-[16px]"
            />
            {entry.title}
            {mode === 'view' && (
              <div className="italic">
                [
                {entry.code ??
                  entry.code_legacy ??
                  'code to be generated upon approval'}
                ]
              </div>
            )}
            {hasErrors && <ErrorTag />}
          </Link>
          {withExtraProjectInfo ? (
            <div className="ml-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <span>Agency:</span>
                <h4 className="m-0"> {entry.agency}</h4>
              </div>
              <span>|</span>
              <div className="flex items-center gap-2.5">
                <span>Project status:</span>
                <h4 className="m-0"> {entry.status}</h4>
              </div>
            </div>
          ) : (
            index !== (data?.length ?? 0) - 1 && <Divider className="my-3" />
          )}
        </div>
      )
    })}
    {canRefreshStatus && (
      <div className="mt-8 flex items-center gap-2">
        <div
          className="flex cursor-pointer items-center gap-2 text-lg normal-case leading-none"
          onClick={(e) => {
            e.stopPropagation()

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

export const ClosedList = ({
  title,
  errorText,
}: {
  title: string
  errorText?: string
}) => (
  <div className="transition-opacity flex items-center justify-between gap-2 opacity-100 duration-300 ease-in-out">
    <div className="flex flex-row items-center gap-2.5 text-lg">
      <span className="leading-none">{title}</span>
      {errorText && <ErrorTag />}
    </div>
    <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
      <IoChevronDown className="text-primary" size={14} />
    </div>
  </div>
)

export const OpenedList = ({
  title,
  data,
  errorText,
  errorAlert,
  getTrancheErrors,
  loaded,
  canRefreshStatus,
  mode,
}: {
  title: string
  data: RelatedProjectsType[]
  errorText?: string
  errorAlert?: ReactNode
  getTrancheErrors?: () => void
  loaded?: boolean
  canRefreshStatus?: boolean
  mode?: string
}) => (
  <div className="transition-opacity flex flex-col gap-6 opacity-100 duration-300 ease-in-out">
    <div className="flex items-center justify-between gap-2 text-lg">
      <span>{title}</span>
      <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-solid border-primary bg-[#EBFF00]">
        <IoChevronUp className="text-primary" size={14} />
      </div>
    </div>
    {errorText && errorAlert}
    <RelatedProjects
      getErrors={getTrancheErrors}
      isLoaded={loaded}
      {...{ data, canRefreshStatus, mode }}
    />
  </div>
)

export const DisabledAlert = (
  <IoAlertCircle
    className="mb-0.5 rounded-full bg-[#002A3C] opacity-20"
    color="#EBFF00"
  />
)

export const displaySelectedOption = (
  filters: Record<string, any>,
  entities: any,
  entityIdentifier: string,
  handleFilterChange: any,
  handleParamsChange: any,
  field: string = 'id',
) =>
  filters?.[entityIdentifier]?.map((entity: any) => {
    const entityId = entity[field]
    const entityData = entities?.get(entityId)

    return (
      <Typography
        key={entityId}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-200 px-2 py-1 text-lg font-normal text-black theme-dark:bg-gray-700/20"
        component="p"
        variant="h6"
      >
        {entityData?.name ||
          entityData?.label ||
          entityData?.code ||
          entityData?.code_legacy}
        <IoClose
          className="cursor-pointer"
          size={18}
          color="#666"
          onClick={() => {
            const values = filters[entityIdentifier] || []
            const newValue = filter(
              values,
              (value) => value[field] !== entityId,
            )

            handleFilterChange({
              [entityIdentifier]: newValue,
            })
            handleParamsChange({
              [entityIdentifier]: newValue
                .map((item: any) => item[field])
                .join(','),
              offset: 0,
            })
          }}
        />
      </Typography>
    )
  })

export const DropDownButtonProps: ButtonProps = {
  endIcon: <MdKeyboardArrowDown />,
  size: 'large',
  variant: 'contained',
}

export const DropDownMenuProps: Omit<MenuProps, 'open'> = {
  PaperProps: {
    className: 'mt-1 border border-solid border-black rounded-lg',
  },
  transitionDuration: 0,
}

export const LoadingTab = (
  <CircularProgress size="20px" className="mb-0.5 text-gray-400" />
)
