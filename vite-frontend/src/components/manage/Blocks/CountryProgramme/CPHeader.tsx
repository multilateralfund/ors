import type { IValidationContext } from '@ors/contexts/Validation/types'
import {
  UserType,
  isCountryUserType,
  userCanDeleteCurrentDraft,
  userCanSubmitFinalReport,
  userCanSubmitReport,
} from '@ors/types/user_types'

import { useContext } from 'react'
import React, { useMemo, useState } from 'react'

import { Button, ButtonProps, Divider, MenuProps, Tooltip } from '@mui/material'
import cx from 'classnames'
import { Dictionary, capitalize, orderBy } from 'lodash'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import Link from '@ors/components/ui/Link/Link'
import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { formattedDateFromTimestamp, uploadFiles } from '@ors/helpers'
import api from '@ors/helpers/Api/_api'
import useClickOutside from '@ors/hooks/useClickOutside'
import { useStore } from '@ors/store'

import ConfirmDialog from '../Replenishment/ConfirmDialog'
import ConfirmSubmission from './ConfirmSubmission'
import { useEditLocalStorage } from './useLocalStorage'

import { IoChevronDown } from 'react-icons/io5'
import { MdKeyboardArrowDown } from 'react-icons/md'

const DropDownButtonProps: ButtonProps = {
  endIcon: <MdKeyboardArrowDown />,
  size: 'large',
  variant: 'contained',
}
const DropDownMenuProps: Omit<MenuProps, 'open'> = {
  PaperProps: {
    className: 'mt-1 border border-solid border-black rounded-lg',
  },
}

const CloseDiffButton = (props: any) => {
  const { report } = props

  if (!report.data) return null

  const isLatestVersion = !report.data?.final_version_id

  const href = isLatestVersion
    ? `/country-programme/${report.country?.iso3}/${report.data.year}`
    : `/country-programme/${report.country!.iso3}/${report.data.year}/archive/${report.data.version}`

  return (
    <Link
      className="btn-close ml-auto bg-gray-600 px-4 py-2 shadow-none"
      color="secondary"
      href={href}
      size="large"
      variant="contained"
      button
    >
      Close
    </Link>
  )
}

const ReportDiffButton = (props: any) => {
  const { report } = props

  const showButton =
    (report.versions?.data?.length || 0) > 1 && report.data?.version !== 1

  if (!showButton) return null
  if (report.variant?.model !== 'V') return null

  return (
    <Link
      className="px-5"
      color="secondary"
      href={`/country-programme/${report.country?.iso3}/${report.data.year}/diff/${report.data.version}`}
      prefetch={false}
      size="large"
      variant="contained"
      button
    >
      See differences
    </Link>
  )
}

const HeaderVersionsDropdown = () => {
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)
  const { report } = useStore((state) => state.cp_reports)

  const toggleShowVersionsMenu = () => setShowVersionsMenu((prev) => !prev)

  const ref = useClickOutside<HTMLDivElement>(() => {
    setShowVersionsMenu(false)
  })

  const versions =
    report.data && report.country
      ? orderBy(report.versions.data, 'version', 'desc').map(
          (version, idx) => ({
            id: version.id,
            formattedDate: formattedDateFromTimestamp(version.created_at),
            isDraft: version.status === 'draft',
            isFinal: version.status === 'final',
            label: `Version ${version.version}`,
            url:
              idx == 0
                ? `/country-programme/${report.country!.iso3}/${version.year}`
                : `/country-programme/${report.country!.iso3}/${version.year}/archive/${version.version}`,
          }),
        )
      : []

  const tagLatest = (
    <span className="mx-2 rounded-md bg-gray-400 p-1 text-xs text-white">
      LATEST
    </span>
  )
  const tagDraft = (
    <span className="mx-2 rounded-md bg-warning p-1 text-xs text-white">
      Draft
    </span>
  )

  return (
    <div className="relative">
      <div
        className="flex cursor-pointer items-center justify-between gap-x-2"
        ref={ref}
        onClick={toggleShowVersionsMenu}
      >
        <PageHeading>{report?.data?.name}</PageHeading>
        <IoChevronDown className="text-5xl font-bold text-gray-700" />
      </div>
      <div
        className={cx(
          'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-none border border-solid border-primary bg-gray-A100 opacity-0 transition-all',
          {
            'collapse scale-y-0': !showVersionsMenu,
            'scale-y-100 opacity-100': showVersionsMenu,
          },
        )}
      >
        {versions.map((info, idx) => (
          <NextLink
            key={info.id}
            className="flex items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
            href={info.url}
            prefetch={false}
          >
            <div className="flex w-56 items-center justify-between hover:text-white">
              <div>{info.label}</div>
              <div className="flex items-center">
                {idx == 0 && (info.isFinal ? tagLatest : tagDraft)}
                {idx == 1 && versions[0].isDraft && tagLatest}
                {info.formattedDate}
              </div>
            </div>
          </NextLink>
        ))}
      </div>
    </div>
  )
}

const HeaderTag = ({ children }: React.PropsWithChildren) => {
  const { report } = useStore((state) => state.cp_reports)
  const { status } = report?.data || {}

  return (
    <span
      className={cx(
        'self-baseline rounded p-1 font-medium uppercase leading-none',
        {
          'bg-mlfs-hlYellow': status === 'final',
          'bg-warning': status === 'draft',
        },
      )}
    >
      {children}
    </span>
  )
}

const ViewHeaderTag = () => {
  const { report } = useStore((state) => state.cp_reports)
  const { status } = report?.data || {}
  const label = useMemo(() => {
    switch (status) {
      case 'final':
        return 'Latest'
      case 'draft':
        return 'Draft'
      default:
        return ''
    }
  }, [status])

  return <HeaderTag>{capitalize(label)}</HeaderTag>
}

const EditHeaderTag = () => {
  const { report } = useStore((state) => state.cp_reports)
  const latest = useMemo(() => {
    return report.versions.data?.[0]
  }, [report.versions.data])

  const date = useMemo(
    () => (latest ? formattedDateFromTimestamp(latest.created_at) : '...'),
    [latest],
  )

  return (
    <HeaderTag>
      Latest: <span className="text-gray">{date}</span>
    </HeaderTag>
  )
}

const ArchiveHeaderTag = () => {
  const { report } = useStore((state) => state.cp_reports)
  const { version } = report?.data || {}

  return <HeaderTag>{`Version ${version}`}</HeaderTag>
}

const ArchiveHeaderActions = () => {
  return <div className="flex items-center"></div>
}

interface ViewHeaderActionsProps {
  validation?: IValidationContext
}

const ViewHeaderActions = (props: ViewHeaderActionsProps) => {
  const { validation } = props
  const { cacheInvalidateReport, fetchBundle, report } = useStore(
    (state) => state.cp_reports,
  )
  const { enqueueSnackbar } = useSnackbar()
  const { user_type } = useStore((state) => state.user.data)

  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isDraft = report.data?.status === 'draft'

  const hasMultipleVersions =
    (report.versions?.data?.length || 0) > 1 && report.data?.version !== 1
  const userCanSeeEditButton =
    userCanDeleteCurrentDraft[user_type as UserType] && hasMultipleVersions

  const localStorage = useEditLocalStorage(report)

  function handleShowConfirmation() {
    setShowConfirm(true)
  }
  function handleShowDeleteConfirmation() {
    setShowDeleteConfirm(true)
  }

  function handleSubmissionConfirmation() {
    setShowConfirm(false)
    handleSubmitFinal()
  }

  function handleDeleteConfirmation() {
    setShowDeleteConfirm(false)
    deleteVersion()
  }

  async function handleSubmitFinal() {
    try {
      const response = await api(
        `/api/country-programme/report/${report.data?.id}/status-update/`,
        {
          data: {
            status: 'final',
          },
          method: 'PUT',
        },
      )
      localStorage.clear()
      enqueueSnackbar(
        <>
          Submit submission for {response.country} {response.year}.
        </>,
        { variant: 'success' },
      )

      cacheInvalidateReport(response.country_id, response.year)
      await fetchBundle(response.country_id, response.year)
    } catch (error) {
      const errors = await error.json()
      errors.detail &&
        enqueueSnackbar(errors.detail, {
          variant: 'error',
        })
    }
  }

  async function deleteVersion() {
    try {
      const response = await api(
        `api/country-programme/reports/${report.data?.id}/`,
        {
          method: 'DELETE',
        },
      )

      enqueueSnackbar(<>Version deleted successfully.</>, {
        variant: 'success',
      })
      cacheInvalidateReport(response.country_id, response.year)
      await fetchBundle(response.country_id, response.year, false)
      localStorage.clear()
    } catch (error) {
      const errors = await error.json()
      errors.detail &&
        enqueueSnackbar(errors.detail, {
          variant: 'error',
        })
    }
  }

  if (!userCanSubmitReport[user_type as UserType]) return null

  const EditButton = ({ title }: { title: string }) => (
    <Link
      className="px-4 py-2 shadow-none"
      color="secondary"
      href={`/country-programme/${report.country?.iso3}/${report.data?.year}/edit/`}
      size="large"
      variant="contained"
      button
    >
      {title}
    </Link>
  )

  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4 px-0">
          <div className="flex justify-between gap-x-4">
            {isDraft && userCanSeeEditButton && (
              <Dropdown
                className="px-4 py-2 shadow-none"
                ButtonProps={DropDownButtonProps}
                MenuProps={DropDownMenuProps}
                color="secondary"
                label={<>Edit report</>}
              >
                <Dropdown.Item className="bg-transparent normal-case text-primary">
                  <Link
                    className="no-underline"
                    href={`/country-programme/${report.country?.iso3}/${report.data?.year}/edit/`}
                  >
                    Edit report
                  </Link>
                </Dropdown.Item>
                <Divider className="m-0" />
                <Dropdown.Item
                  className="bg-transparent font-medium normal-case text-red-900"
                  onClick={handleShowDeleteConfirmation}
                >
                  Delete version
                </Dropdown.Item>
              </Dropdown>
            )}
            {isDraft && !userCanSeeEditButton && (
              <EditButton title={'Edit report'} />
            )}
            {!isDraft && <EditButton title={'Submit revised data'} />}
            {isDraft && (
              <Button
                color="primary"
                disabled={!userCanSubmitFinalReport[user_type as UserType]}
                size="small"
                variant="contained"
                onClick={handleShowConfirmation}
              >
                Submit final version
              </Button>
            )}
            <Link
              className="btn-close bg-gray-600 px-4 py-2 shadow-none"
              color="secondary"
              href={`/country-programme`}
              size="large"
              variant="contained"
              button
            >
              Close
            </Link>
          </div>
        </div>
      )}
      {showConfirm ? (
        <ConfirmSubmission
          mode={'edit'}
          validation={validation}
          onCancel={() => setShowConfirm(false)}
          onSubmit={handleSubmissionConfirmation}
        />
      ) : null}
      {showDeleteConfirm && (
        <ConfirmDialog
          title={'Delete version'}
          onCancel={() => {
            setShowDeleteConfirm(false)
          }}
          onSubmit={() => handleDeleteConfirmation()}
        >
          <div className="text-lg">
            Are you sure you want to delete this version ?
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}

interface EditHeaderActionsProps {
  getSubmitFormData: () => Dictionary<any>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, any>>>
  validation: IValidationContext
}

const EditHeaderActions = ({
  getSubmitFormData,
  setErrors,
  validation,
}: EditHeaderActionsProps) => {
  const router = useRouter()
  const { cacheInvalidateReport, fetchBundle, report } = useStore(
    (state) => state.cp_reports,
  )
  const { enqueueSnackbar } = useSnackbar()
  const { user_type } = useStore((state) => state.user.data)

  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const localStorage = useEditLocalStorage(report)

  function handleShowConfirmation() {
    setShowConfirm(true)
  }
  function handleShowDeleteConfirmation() {
    setShowDeleteConfirm(true)
  }

  function handleSubmissionConfirmation() {
    setShowConfirm(false)
    getReportSubmitter('final')()
  }

  function handleDeleteConfirmation() {
    setShowDeleteConfirm(false)
    deleteVersion()
  }

  const isDraft = report.data?.status === 'draft'
  const isFinal = report.data?.status === 'final'

  const showDraftFromFinalButton = isFinal && report.variant?.model === 'V'

  const hasMultipleVersions =
    (report.versions?.data?.length || 0) > 1 && report.data?.version !== 1
  const userCanSeeUpdateButton =
    userCanDeleteCurrentDraft[user_type as UserType] && hasMultipleVersions

  if (!userCanSubmitReport[user_type as UserType]) return null

  function getReportSubmitter(status?: 'draft' | 'final') {
    return async () => {
      try {
        const allData = getSubmitFormData()
        const { files, ...reportData } = allData

        if (files && files.length > 0) {
          await uploadFiles(
            `api/country-programme/files/?country_id=${report.country?.id}&year=${report.data?.year}`,
            files,
          )
        }

        const response = await api(
          `api/country-programme/reports/${report.data?.id}/`,
          {
            data: {
              ...report.data,
              ...reportData,
              ...(status ? { status } : {}),
            },
            method: 'PUT',
          },
        )
        setErrors({})
        enqueueSnackbar(
          <>
            Updated submission for {response.country} {response.year}.
          </>,
          { variant: 'success' },
        )
        cacheInvalidateReport(response.country_id, response.year)
        await fetchBundle(response.country_id, response.year, false)
        localStorage.clear()
        status === 'final' &&
          router.push(
            `/country-programme/${report.country?.iso3}/${response.year}`,
          )
      } catch (error) {
        if (error.status === 400) {
          const errors = await error.json()
          setErrors({ ...errors })
          enqueueSnackbar(<>Please make sure all the inputs are correct.</>, {
            variant: 'error',
          })
          if (errors.files) {
            enqueueSnackbar(errors.files, {
              variant: 'error',
            })
          }
        } else {
          enqueueSnackbar(<>An error occurred. Please try again.</>, {
            variant: 'error',
          })
          setErrors({})
        }
      }
    }
  }

  async function deleteVersion() {
    try {
      const response = await api(
        `api/country-programme/reports/${report.data?.id}/`,
        {
          method: 'DELETE',
        },
      )
      setErrors({})
      enqueueSnackbar(<>Version deleted successfully.</>, {
        variant: 'success',
      })
      cacheInvalidateReport(response.country_id, response.year)
      await fetchBundle(response.country_id, response.year, false)
      localStorage.clear()
    } catch (error) {
      const errors = await error.json()
      errors.detail &&
        enqueueSnackbar(errors.detail, {
          variant: 'error',
        })
    }
  }

  function getSubmitFinalTooltipTitle() {
    if (!userCanSubmitFinalReport[user_type as UserType] && isDraft) {
      return isCountryUserType[user_type as UserType]
        ? 'Only Country Submitter users can submit Final versions'
        : 'Only Secretariat users can submit Final versions'
    }
    return ''
  }

  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4 px-0">
          {isDraft && userCanSeeUpdateButton && (
            <Dropdown
              className="px-4 py-2 shadow-none"
              ButtonProps={DropDownButtonProps}
              MenuProps={DropDownMenuProps}
              color="primary"
              label={<>Update draft</>}
            >
              <Dropdown.Item
                className="bg-transparent normal-case text-primary"
                onClick={getReportSubmitter()}
              >
                Update draft
              </Dropdown.Item>
              <Divider className="m-0" />
              <Dropdown.Item
                className="bg-transparent font-medium normal-case text-red-900"
                onClick={handleShowDeleteConfirmation}
              >
                Delete version
              </Dropdown.Item>
            </Dropdown>
          )}
          {isDraft && !userCanSeeUpdateButton && (
            <Button
              className="px-4 py-2 shadow-none"
              color="primary"
              size="large"
              variant="contained"
              onClick={getReportSubmitter()}
            >
              Update draft
            </Button>
          )}
          {showDraftFromFinalButton && (
            <Button
              className="px-4 py-2 shadow-none"
              color="secondary"
              size="large"
              variant="contained"
              onClick={getReportSubmitter('draft')}
            >
              Save draft
            </Button>
          )}
          <Tooltip title={getSubmitFinalTooltipTitle()}>
            <span>
              <Button
                className="px-4 py-2 shadow-none"
                color="secondary"
                size="large"
                variant="contained"
                disabled={
                  !userCanSubmitFinalReport[user_type as UserType] && isDraft
                }
                onClick={handleShowConfirmation}
              >
                {isDraft ? 'Submit final version' : 'Submit new version'}
              </Button>
            </span>
          </Tooltip>
          <Link
            className="btn-close bg-gray-600 px-4 py-2 shadow-none"
            color="secondary"
            href={`/country-programme/${report.country?.iso3}/${report.data.year}`}
            size="large"
            variant="contained"
            button
          >
            Close
          </Link>
        </div>
      )}
      {showConfirm ? (
        <ConfirmSubmission
          mode={'edit'}
          validation={validation}
          onCancel={() => setShowConfirm(false)}
          onSubmit={handleSubmissionConfirmation}
        />
      ) : null}
      {showDeleteConfirm && (
        <ConfirmDialog
          title={'Delete version'}
          onCancel={() => {
            setShowDeleteConfirm(false)
          }}
          onSubmit={() => handleDeleteConfirmation()}
        >
          <div className="text-lg">
            Are you sure you want to delete this version ?
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}

const CPHeader = ({
  actions = <ViewHeaderActions />,
  seeDifferences = true,
  tag = <ViewHeaderTag />,
  titlePrefix,
}: {
  actions?: React.JSX.Element
  seeDifferences?: boolean
  tag?: React.JSX.Element
  titlePrefix?: React.JSX.Element
}) => {
  const { report } = useStore((state) => state.cp_reports)

  return (
    !!report.data && (
      <HeaderTitle>
        <div className="mb-2 font-[500] uppercase">
          Country programme report
        </div>
        <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2">
            <div className="flex items-center gap-x-2">
              {titlePrefix}
              <HeaderVersionsDropdown />
              {tag}
            </div>
            {seeDifferences && <ReportDiffButton report={report} />}
          </div>
          <div className="ml-auto">{actions}</div>
        </div>
      </HeaderTitle>
    )
  )
}

const CPCreateHeader = ({
  actions,
  currentYear,
}: {
  actions: React.JSX.Element
  currentYear: number
}) => {
  return (
    <div className="my-12 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-6">
      <div className="flex items-center gap-x-2">
        <PageHeading>New submission - {currentYear}</PageHeading>
      </div>
      <div className="ml-auto">{actions}</div>
    </div>
  )
}

const CPViewHeader = () => {
  const validation = useContext(ValidationContext)
  return (
    <CPHeader
      actions={<ViewHeaderActions validation={validation} />}
      tag={<ViewHeaderTag />}
    />
  )
}

const CPEditHeader = (props: Omit<EditHeaderActionsProps, 'validation'>) => {
  const validation = useContext(ValidationContext)
  return (
    <CPHeader
      actions={<EditHeaderActions validation={validation} {...props} />}
      seeDifferences={false}
      tag={<EditHeaderTag />}
      titlePrefix={<span className="text-4xl">Editing: </span>}
    />
  )
}

const CPArchiveHeader = () => {
  return (
    <CPHeader actions={<ArchiveHeaderActions />} tag={<ArchiveHeaderTag />} />
  )
}

const CPDiffHeader = () => {
  const { report } = useStore((state) => state.cp_reports)
  const { versions } = report
  const report_version = report.data?.version

  const currentVersion = useMemo(() => {
    if (!report_version) return null
    const versionObject = versions.data?.find(
      (v) => v.version === report_version,
    )
    if (!versionObject) return null
    return {
      date: formattedDateFromTimestamp(versionObject.created_at),
      status: versionObject.status,
      version: versionObject.version,
    }
  }, [versions, report_version])

  const previousVersion = useMemo(() => {
    if (!report_version) return null
    const versionObject = versions.data?.find(
      (v) => v.version === report_version - 1,
    )
    if (!versionObject) return null

    return {
      date: formattedDateFromTimestamp(versionObject.created_at),
      status: versionObject.status,
      version: versionObject.version,
    }
  }, [versions, report_version])

  const VersionTag = ({ date, status, version }: any) => {
    return (
      <span
        className={cx('self-baseline rounded p-1', {
          'bg-mlfs-hlYellow': status === 'final',
          'bg-warning': status === 'draft',
        })}
      >
        Version {version} - {date}
      </span>
    )
  }

  return (
    !!report.data && (
      <HeaderTitle>
        <div className="mb-2 font-[500] uppercase">
          Country programme report
        </div>
        <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
            <div className="flex flex-wrap items-center gap-x-4">
              <h1 className="m-0 text-5xl font-normal leading-normal">
                Comparing:
              </h1>
              <h1 className="m-0 text-5xl leading-normal">
                {report.data?.name}
              </h1>
            </div>
            <div className="self-baseline font-medium uppercase leading-none">
              <VersionTag {...currentVersion} />
              <span className="mx-2">VS.</span>
              <VersionTag {...previousVersion} />
            </div>
          </div>
          <CloseDiffButton report={report} />
        </div>
      </HeaderTitle>
    )
  )
}

export {
  CPArchiveHeader,
  CPCreateHeader,
  CPDiffHeader,
  CPEditHeader,
  CPViewHeader,
}
