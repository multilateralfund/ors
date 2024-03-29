import React from 'react'

import { Button, Typography } from '@mui/material'
import cx from 'classnames'
import { Dictionary, capitalize, concat, orderBy } from 'lodash'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import api from '@ors/helpers/Api/Api'
import { useStore } from '@ors/store'

import { IoChevronDown } from 'react-icons/io5'

const HeaderVersionsDropdown = () => {
  const { report } = useStore((state) => state.cp_reports)
  const versions = concat(
    [
      {
        id: 0,
        date: report.data?.year,
        label: `Version ${(report.versions?.data?.length || 0) + 1}`,
        url: `/country-programme/${report.country!.iso3}/${report.data?.year}`,
      },
    ],
    report.data && report.country
      ? orderBy(report.versions.data, 'version', 'desc').map(
          (version, idx, arr) => ({
            id: version.id,
            date: version.year,
            label: `Version ${version.version}`,
            url: `/country-programme/${report.country!.iso3}/${version.year}/archive/${arr.length - idx}`,
          }),
        )
      : [],
  )

  return (
    <Dropdown
      className="p-0"
      MenuProps={{
        slotProps: {
          paper: {
            className:
              'max-h-[200px] overflow-y-auto bg-gray-A100 rounded-none border-primary',
          },
        },
      }}
      label={
        <div className="flex items-center justify-between gap-x-2">
          <Typography component="h1" variant="h2">
            {report?.data?.name}
          </Typography>
          <IoChevronDown className="text-5xl font-bold" />
        </div>
      }
    >
      {versions.map((info, idx) => (
        <Dropdown.Item
          key={info.id}
          className="flex items-center gap-x-2 rounded-none text-black no-underline"
          component={Link}
          // @ts-ignore
          href={info.url}
        >
          <div className="flex w-56 items-center justify-between">
            <div>{info.label}</div>
            <div className="flex items-center">
              {idx == 0 && (
                <span className="mx-2 rounded-md bg-gray-400 p-1 text-xs text-white">
                  LATEST
                </span>
              )}
              {info.date}
            </div>
          </div>
        </Dropdown.Item>
      ))}
    </Dropdown>
  )
}

const HeaderTag = ({ archive }: { archive?: boolean }) => {
  const { report } = useStore((state) => state.cp_reports)
  const { status, version } = report?.data || {}
  let label = ''

  switch (status) {
    case 'final':
      label = 'Latest'
      break
    case 'draft':
      label = 'Draft'
      break
    default:
      break
  }

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
      {archive ? `Version ${version}` : capitalize(label)}
    </span>
  )
}

interface HeaderActions {
  archive?: boolean
}

const ViewHeaderActions = ({ archive = false }: HeaderActions) => {
  const { report, setReport } = useStore((state) => state.cp_reports)
  const { enqueueSnackbar } = useSnackbar()
  return (
    <div className="flex items-center">
      {!archive && !!report.data && (
        <div className="container flex w-full justify-between gap-x-4">
          {/* <Link
            className="bg-gray-600 px-4 py-2 shadow-none"
            href="/country-programme"
            size="large"
            variant="contained"
            button
          >
            Close
          </Link> */}
          <div className="flex justify-between gap-x-4">
            <Link
              className="px-4 py-2 shadow-none"
              color="secondary"
              href={`/country-programme/${report.country?.iso3}/${report.data?.year}/edit/`}
              size="large"
              variant="contained"
              button
            >
              Edit report
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
  return (
    <div className="flex items-center">
      {!!report.data && (
        <div className="container flex w-full justify-between gap-x-4">
          <Link
            className="bg-gray-600  px-4 py-2 shadow-none"
            color="secondary"
            href={`/country-programme/${report.country?.iso3}/${report.data.year}`}
            size="large"
            variant="contained"
            button
          >
            Close
          </Link>
          {report.data.status === 'draft' && (
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
            {report.data.status === 'draft'
              ? 'Submit final version'
              : 'Submit new version'}
          </Button>
        </div>
      )}
    </div>
  )
}

const CPHeader = ({
  actions = <ViewHeaderActions />,
  archive,
}: {
  actions?: React.JSX.Element
  archive?: boolean
}) => {
  const { report } = useStore((state) => state.cp_reports)

  return (
    !!report.data && (
      <HeaderTitle memo={report.data.status && report.versions.data}>
        <div className="mb-2 font-[500] uppercase">
          Country programme report
        </div>
        <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-8">
          <div className="flex items-center gap-x-2">
            <HeaderVersionsDropdown />
            <HeaderTag archive={archive} />
          </div>
          {actions}
        </div>
      </HeaderTitle>
    )
  )
}

const CPViewHeader = ({ archive }: { archive?: boolean }) => {
  return <CPHeader actions={<ViewHeaderActions archive={archive} />} />
}

const CPEditHeader = (props: EditHeaderActionsProps) => {
  return <CPHeader actions={<EditHeaderActions {...props} />} />
}

export { CPEditHeader, CPViewHeader }
