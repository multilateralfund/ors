import type { IValidationContext } from '@ors/contexts/Validation/types'
import { UserType, userCanSubmitReport } from '@ors/types/user_types'

import { useContext } from 'react'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@mui/material'
import cx from 'classnames'
import { Dictionary, capitalize, orderBy } from 'lodash'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Link from '@ors/components/ui/Link/Link'
import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { uploadFiles } from '@ors/helpers'
import api from '@ors/helpers/Api/_api'
import useClickOutside from '@ors/hooks/useClickOutside'
import { useStore } from '@ors/store'

import ConfirmSubmission from './ConfirmSubmission'

import { IoChevronDown } from 'react-icons/io5'

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
      size="large"
      variant="contained"
      button
    >
      See differences
    </Link>
  )
}

function padDateNr(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

const formattedDateFromTimestamp = (timestring: string) => {
  const date = new Date(timestring)
  return `${padDateNr(date.getDate())}.${padDateNr(date.getMonth() + 1)}.${date.getFullYear()}`
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
        <h1 className="m-0 text-5xl leading-normal">{report?.data?.name}</h1>
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

  const isDraft = report.data?.status === 'draft'

  function handleShowConfirmation() {
    setShowConfirm(true)
  }

  function handleSubmissionConfirmation() {
    setShowConfirm(false)
    handleSubmitFinal()
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

  if (!userCanSubmitReport[user_type as UserType]) return null

  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4 px-0">
          <div className="flex justify-between gap-x-4">
            <Link
              className="px-4 py-2 shadow-none"
              color="secondary"
              href={`/country-programme/${report.country?.iso3}/${report.data?.year}/edit/`}
              size="large"
              variant="contained"
              button
            >
              {isDraft ? 'Edit report' : 'Add new version'}
            </Link>
            {isDraft && (
              <Button
                color="primary"
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
              View Reports
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

  function handleShowConfirmation() {
    setShowConfirm(true)
  }

  function handleSubmissionConfirmation() {
    setShowConfirm(false)
    getReportSubmitter('final')()
  }

  const isDraft = report.data?.status === 'draft'
  const isFinal = report.data?.status === 'final'

  const showDraftFromFinalButton = isFinal && report.variant?.model === 'V'

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

  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4 px-0">
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
          {isDraft && (
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
          <Button
            className="px-4 py-2 shadow-none"
            color="secondary"
            size="large"
            variant="contained"
            onClick={handleShowConfirmation}
          >
            {isDraft ? 'Submit final version' : 'Submit new version'}
          </Button>
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
  const [memo, setMemo] = useState(0)

  useEffect(() => {
    setMemo((prev) => prev + 1)
  }, [report.data?.status, report.versions.data, actions])

  return (
    !!report.data && (
      <HeaderTitle memo={memo}>
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
        <h1 className="m-0 text-4xl leading-normal">
          New submission - {currentYear}
        </h1>
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
  const [memo, setMemo] = useState(0)
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

  useEffect(() => {
    setMemo((prev) => prev + 1)
  }, [report.data?.status, report.versions.data])

  return (
    !!report.data && (
      <HeaderTitle memo={memo}>
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
