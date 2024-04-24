import { UserType, userTypeVisibility } from '@ors/types/user_types'

import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@mui/material'
import cx from 'classnames'
import { Dictionary, capitalize, orderBy } from 'lodash'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Link from '@ors/components/ui/Link/Link'
import api from '@ors/helpers/Api/_api'
import useClickOutside from '@ors/hooks/useClickOutside'
import { useStore } from '@ors/store'

import { IoChevronDown } from 'react-icons/io5'

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

const ViewHeaderActions = () => {
  const { cacheInvalidateReport, fetchVersions, report, setReport } = useStore(
    (state) => state.cp_reports,
  )
  const { enqueueSnackbar } = useSnackbar()
  const { user_type } = useStore((state) => state.user.data)

  const isDraft = report.data?.status === 'draft'

  if (!userTypeVisibility[user_type as UserType]) return null

  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4">
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
            {report.data.status === 'draft' && (
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={async () => {
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
                        Submit submission for {response.country} {response.year}
                        .
                      </>,
                      { variant: 'success' },
                    )
                    setReport({
                      data: {
                        ...report.data,
                        ...response,
                      },
                    })
                    cacheInvalidateReport(response.country_id, response.year)
                    fetchVersions(response.country_id, response.year)
                    window.scrollTo({ behavior: 'smooth', top: 0 })
                  } catch (error) {
                    const errors = await error.json()
                    errors.detail &&
                      enqueueSnackbar(errors.detail, {
                        variant: 'error',
                      })
                  }
                }}
              >
                Submit final version
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface EditHeaderActionsProps {
  getSubmitFormData: () => Dictionary<any>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, any>>>
}

const EditHeaderActions = ({
  getSubmitFormData,
  setErrors,
}: EditHeaderActionsProps) => {
  const router = useRouter()
  const { cacheInvalidateReport, report } = useStore(
    (state) => state.cp_reports,
  )
  const { enqueueSnackbar } = useSnackbar()
  const { user_type } = useStore((state) => state.user.data)

  const isDraft = report.data?.status === 'draft'
  const isFinal = report.data?.status === 'final'

  const showDraftFromFinalButton = isFinal && report.variant?.model === 'V'

  if (!userTypeVisibility[user_type as UserType]) return null

  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4">
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
              onClick={async () => {
                try {
                  const response = await api(
                    `api/country-programme/reports/${report.data?.id}/`,
                    {
                      data: {
                        ...report.data,
                        ...getSubmitFormData(),
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
                  router.push(
                    `/country-programme/${report.country?.iso3}/${response.year}`,
                  )
                } catch (error) {
                  if (error.status === 400) {
                    setErrors({ ...(await error.json()) })
                    enqueueSnackbar(
                      <>Please make sure all the inputs are correct.</>,
                      { variant: 'error' },
                    )
                  } else {
                    const errors = await error.json()
                    setErrors({})
                    {
                      errors.detail &&
                        enqueueSnackbar(errors.detail, {
                          variant: 'error',
                        })
                    }
                  }
                }
              }}
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
              onClick={async () => {
                try {
                  const response = await api(
                    `api/country-programme/reports/${report.data?.id}/`,
                    {
                      data: {
                        ...report.data,
                        ...getSubmitFormData(),
                        status: 'draft',
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
                  router.push(
                    `/country-programme/${report.country?.iso3}/${response.year}`,
                  )
                } catch (error) {
                  if (error.status === 400) {
                    setErrors({ ...(await error.json()) })
                    enqueueSnackbar(
                      <>Please make sure all the inputs are correct.</>,
                      { variant: 'error' },
                    )
                  } else {
                    const errors = await error.json()
                    setErrors({})
                    {
                      errors.detail &&
                        enqueueSnackbar(errors.detail, {
                          variant: 'error',
                        })
                    }
                  }
                }
              }}
            >
              Save draft
            </Button>
          )}
          <Button
            className="px-4 py-2 shadow-none"
            color="secondary"
            size="large"
            variant="contained"
            onClick={async () => {
              try {
                const response = await api(
                  `api/country-programme/reports/${report.data?.id}/`,
                  {
                    data: {
                      ...report.data,
                      ...getSubmitFormData(),
                      status: 'final',
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
                router.push(
                  `/country-programme/${report.country?.iso3}/${response.year}`,
                )
              } catch (error) {
                if (error.status === 400) {
                  setErrors({ ...(await error.json()) })
                  enqueueSnackbar(
                    <>Please make sure all the inputs are correct.</>,
                    { variant: 'error' },
                  )
                } else {
                  const errors = await error.json()
                  setErrors({})
                  {
                    errors.detail &&
                      enqueueSnackbar(errors.detail, {
                        variant: 'error',
                      })
                  }
                }
              }
            }}
          >
            {isDraft ? 'Submit final version' : 'Submit new version'}
          </Button>
        </div>
      )}
    </div>
  )
}

const CPHeader = ({
  actions = <ViewHeaderActions />,
  tag = <ViewHeaderTag />,
  titlePrefix,
}: {
  actions?: React.JSX.Element
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
        <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-8">
          <div className="flex items-center gap-x-2">
            {titlePrefix}
            <HeaderVersionsDropdown />
            {tag}
          </div>
          {actions}
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
    <div className="my-12 flex min-h-[40px] items-center justify-between gap-x-8">
      <div className="flex items-center gap-x-2">
        <h1 className="m-0 text-4xl leading-normal">
          New submission - {currentYear}
        </h1>
      </div>
      {actions}
    </div>
  )
}

const CPViewHeader = () => {
  return <CPHeader actions={<ViewHeaderActions />} tag={<ViewHeaderTag />} />
}

const CPEditHeader = (props: EditHeaderActionsProps) => {
  return (
    <CPHeader
      actions={<EditHeaderActions {...props} />}
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

export { CPArchiveHeader, CPCreateHeader, CPEditHeader, CPViewHeader }
