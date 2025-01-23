'use client'
import type { SimpleSelectProps } from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { Country, FiltersType, StatusFilterTypes } from '@ors/types/store'
import {
  UserType,
  isCountryUserType,
  userCanExportData,
  userCanSubmitReport,
} from '@ors/types/user_types'

import React, { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { entries, filter, isEmpty, split, times, union } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'
import SimpleTable from '@ors/components/ui/SimpleTable/SimpleTable'
import { formatApiUrl, getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import Portal from '../../Utils/Portal'

import { IoChevronDownCircle, IoClose, IoEllipse } from 'react-icons/io5'
import { DownloadLink } from '@ors/components/ui/Button/Button'

interface SectionProps {
  filters: any
  groupBy?: string
  maxYear: any
  minYear: any
  section?: number
  setFilters: any
  user_type?: UserType
}

type ReportResponse = {
  comment: null | string
  country: string
  country_id: number
  id: number
  is_archive: boolean
  name: string
  status: 'draft' | 'final'
  version: number
  year: number
}

type ReportsResponse = {
  count: number
  next: null | string
  previous: null | string
  results: ReportResponse[]
}

type paginationType = {
  page: number
  rowsPerPage: number
}

const SUBMISSIONS_PER_PAGE = 20
const LOGS_PER_PAGE = 50
const REPORTS_PER_COUNTRY = 6

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 500)
}

const SortBy = (props: Omit<SimpleSelectProps, 'label'>) => (
  <SimpleSelect className="min-w-52" label="Sort by" {...props} />
)

const StatusLegend = ({ className }: { className?: string }) => {
  return (
    <div className={cx('flex gap-2', className)}>
      <div className="flex items-center gap-2">
        <IoEllipse color="#4191CD" size={12} />
        <Typography>Final</Typography>
      </div>
      <div className="flex items-center gap-2">
        <IoEllipse color="#EE8E34" size={12} />
        <Typography>Draft</Typography>
      </div>
    </div>
  )
}

const CountryYearFilterPills = (props: any) => {
  const { filters, maxYear, minYear, setFilters, setPagination, setParams } =
    props

  const countries = useStore((state) => {
    return state.common.countries_for_listing.data
  })
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

  return (
    <div className="my-6 flex gap-4 print:hidden">
      {filters.country.map((countryId: number) => (
        <Typography
          key={countryId}
          className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 font-normal theme-dark:bg-gray-700/20"
          component="p"
          variant="h6"
        >
          {countriesById.get(countryId)?.name}
          <IoClose
            className="cursor-pointer"
            size={20}
            onClick={() => {
              const values = filters.country || []
              const newValue = filter(values, (value) => value !== countryId)
              setFilters({
                country: newValue,
              })
              setPagination((pagination: paginationType) => ({
                ...pagination,
                page: 1,
              }))
              setParams({
                country_id: newValue.join(','),
                offset: 0,
              })
            }}
          />
        </Typography>
      ))}
      {(filters.range[0] > minYear || filters.range[1] < maxYear) && (
        <Typography
          className="inline-flex items-center gap-2 bg-gray-200 px-4 font-normal theme-dark:bg-gray-700/20"
          component="p"
          variant="h6"
        >
          {filters.range[0]} - {filters.range[1]}
          <IoClose
            className="cursor-pointer"
            size={20}
            onClick={() => {
              setFilters({
                range: [minYear, maxYear],
              })
              setPagination((pagination: paginationType) => ({
                ...pagination,
                page: 1,
              }))
              setParams({
                offset: 0,
                year_max: maxYear,
                year_min: minYear,
              })
            }}
          />
        </Typography>
      )}
    </div>
  )
}

const SubmissionItem = (props: any) => {
  const { filters, group, reports, user_type } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )
  const [showAllReports, setShowAllReports] = useState(
    isCountryUserType[user_type as UserType],
  )
  const denseLayout =
    filters.range.length === 2 && filters.range[1] - filters.range[0] <= 2

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  const toggleReportsVisibility = () => {
    setShowAllReports(!showAllReports)
  }

  return (
    <div className="transition-opacity flex flex-col gap-4 duration-300">
      <Typography variant="h5">{group}</Typography>
      <div
        className={`grid w-full grid-flow-row auto-rows-max gap-6 ${!denseLayout && 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}
      >
        {reports.map((report: any, index: number) => {
          if (!showAllReports && index >= REPORTS_PER_COUNTRY) {
            return null // Hide reports beyond the limit if showAllReports is false
          }
          const dateObject = new Date(report.created_at)
          const formattedDateTime = dateObject.toLocaleDateString(
            undefined,
            options,
          )

          const statusDot = report.status === 'final' ? '#4191CD' : '#EE8E34'
          const status = report.status === 'final' ? 'Final' : 'Draft'

          const country = countriesById.get(report.country_id)

          let reportURL = `/country-programme/${country?.iso3}/${report.year}`
          if (report.is_archive) {
            reportURL = `${reportURL}/archive/${report.version}`
          } else if (report.status === 'draft') {
            reportURL = `${reportURL}/edit`
          }

          return (
            <Link
              key={index}
              className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-secondary pb-2 sm:min-w-60"
              href={reportURL}
              underline="none"
            >
              <>
                <Typography className="text-lg font-semibold" color="secondary">
                  {report.year}
                </Typography>
                <div className="flex items-baseline gap-2">
                  <Tooltip title={status}>
                    <div>
                      <IoEllipse color={statusDot} size={12} />
                    </div>
                  </Tooltip>
                  <Typography className="font-medium">
                    VERSION {report.version}
                  </Typography>
                  <Typography className="ml-4 text-gray-500">
                    {formattedDateTime}
                  </Typography>
                </div>
              </>
            </Link>
          )
        })}
      </div>

      {reports.length > REPORTS_PER_COUNTRY &&
        !isCountryUserType[user_type as UserType] && (
          <div
            className="w-fit cursor-pointer font-medium"
            onClick={toggleReportsVisibility}
          >
            {!showAllReports ? (
              <span key="load-more-button">View More</span>
            ) : (
              <span key="load-less-button">Show Less</span>
            )}
          </div>
        )}
    </div>
  )
}

const SubmissionSection = function SubmissionSection(
  props: { submissionApi: any } & SectionProps,
) {
  const { filters, maxYear, minYear, setFilters, submissionApi, user_type } =
    props
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: SUBMISSIONS_PER_PAGE,
  })
  const [displayAll, setDisplayAll] = useState(false)

  const orderOptions = [
    { label: 'Name, A to Z', value: 'asc' },
    { label: 'Name, Z to A', value: 'desc' },
  ]

  const { count, loaded, loading, results, setParams } = submissionApi

  const memoResults = useMemo(() => {
    if (!loaded) {
      return times(pagination.rowsPerPage, (num) => {
        return {
          id: num + 1,
          isSkeleton: true,
        }
      })
    }
    return [...results]
  }, [results, loaded, pagination.rowsPerPage])

  const pages = Math.ceil(count / pagination.rowsPerPage)

  const handleOrderChange = (option: any) => {
    setPagination({ ...pagination, page: 1 })
    setParams({ offset: 0, ordering: option.value })
  }

  return (
    <div id="country-section">
      <Loading
        className="!fixed bg-action-disabledBackground bg-mui-box-background/70 !duration-300"
        active={loading || !loaded}
      />
      {!isCountryUserType[user_type as UserType] && (
        <Portal domNode="portalSortBy">
          <SortBy options={orderOptions} onChange={handleOrderChange} />
        </Portal>
      )}
      <Portal domNode="portalDisplayAll">
        <DisplayAll
          displayAll={displayAll}
          setDisplayAll={setDisplayAll}
          submissionApi={submissionApi}
        />
      </Portal>
      <CountryYearFilterPills
        filters={filters}
        maxYear={maxYear}
        minYear={minYear}
        setFilters={setFilters}
        setPagination={setPagination}
        setParams={setParams}
      />
      <div className="transition-opacity mb-10 flex w-full max-w-screen-xl flex-wrap gap-8 duration-300">
        {memoResults.length === 0 && (
          <Typography className="px-3" variant="h5">
            No reports found.
          </Typography>
        )}
        {memoResults.map((countryData: any) => {
          if (countryData.isSkeleton)
            return (
              <div key={countryData.id} className="flex flex-col gap-6">
                <Skeleton height={40} variant="text" width="100%" />
                <div className="grid w-full grid-flow-row auto-rows-max gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {times(REPORTS_PER_COUNTRY, (index) => (
                    <div
                      key={index}
                      className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-secondary p-2 sm:min-w-60"
                    >
                      <Skeleton height={40} variant="text" width="100%" />
                    </div>
                  ))}
                </div>
              </div>
            )
          return (
            <SubmissionItem
              key={countryData.id}
              filters={filters}
              group={countryData.group}
              loaded={loaded}
              loading={loading}
              reports={countryData.reports}
              user_type={user_type}
            />
          )
        })}
      </div>
      {!!pages && pages > 1 && !displayAll && (
        <div className="flex items-center justify-center print:hidden">
          <Pagination
            count={pages}
            page={pagination.page}
            siblingCount={1}
            onPaginationChanged={(page) => {
              setPagination({ ...pagination, page: page || 1 })
              setParams({
                limit: pagination.rowsPerPage,
                offset: ((page || 1) - 1) * pagination.rowsPerPage,
              })
            }}
          />
        </div>
      )}
    </div>
  )
}

const LogSection = function LogSection(props: { logApi: any } & SectionProps) {
  const { filters, logApi, maxYear, minYear, setFilters } = props
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: LOGS_PER_PAGE,
  })

  const { count, loaded, loading, results, setParams } = logApi

  const memoResults = useMemo(() => {
    if (!loaded) {
      return times(pagination.rowsPerPage, (num) => {
        return {
          id: num + 1,
          isSkeleton: true,
        }
      })
    }
    return [...results]
  }, [results, loaded, pagination.rowsPerPage])

  const pages = Math.ceil(count / pagination.rowsPerPage)

  return (
    <div id="country-section" className="relative">
      <Loading
        className="bg-mui-box-background/70 !duration-300"
        active={loading}
      />
      <CountryYearFilterPills
        filters={filters}
        maxYear={maxYear}
        minYear={minYear}
        setFilters={setFilters}
        setPagination={setPagination}
        setParams={setParams}
      />
      {/* Content */}
      <div className="mb-10 flex w-full max-w-screen-xl">
        <SimpleTable
          data={memoResults}
          setPagination={setPagination}
          setParams={setParams}
        />
      </div>
      {/* Pagination */}
      {!!pages && pages > 1 && (
        <div className="flex items-center justify-center print:hidden">
          <Pagination
            count={pages}
            page={pagination.page}
            siblingCount={1}
            onPaginationChanged={(page) => {
              setPagination({ ...pagination, page: page || 1 })
              setParams({
                limit: pagination.rowsPerPage,
                offset: ((page || 1) - 1) * pagination.rowsPerPage,
              })
            }}
          />
        </div>
      )}
    </div>
  )
}

const StatusFilter = (props: any) => {
  const { filters, setFilters } = props
  const statusFilterOrder = ['all', 'final', 'draft']

  const statusLabels: Record<string, string> = {
    all: 'View All',
    draft: 'Drafts',
    final: 'Final',
  }
  const changeHandler = (
    _: React.MouseEvent<HTMLElement>,
    newValue: StatusFilterTypes,
  ) => {
    setFilters({
      status: newValue,
    })
  }
  return (
    <ToggleButtonGroup
      aria-label="Platform"
      color="primary"
      fullWidth={true}
      value={filters.status}
      onChange={changeHandler}
      exclusive
    >
      {statusFilterOrder.map((key) => (
        <ToggleButton
          key={key}
          className="min-w-28 rounded-none border-primary py-2 text-base tracking-wide first:rounded-l-lg last:rounded-r-lg"
          value={key}
          classes={{
            selected: 'bg-primary text-mlfs-hlYellow',
            standard: 'bg-white text-primary',
          }}
        >
          {statusLabels[key]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const CountrySelect = (props: { filters: any; setFilters: any }) => {
  const { filters, setFilters } = props
  const { country: user_country, user_type } = useStore(
    (state) => state.user.data,
  )
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const country = countries.find((c) => c.name === user_country)

  return (
    <div className="relative">
      <Field<Country>
        FieldProps={{ className: 'mb-0 w-full CPListing' }}
        getOptionLabel={(option) => (option as Country).name}
        options={countries}
        popupIcon={<IoChevronDownCircle color="black" size={24} />}
        value={isCountryUserType[user_type as UserType] ? country : null}
        widget="autocomplete"
        Input={{
          placeholder: 'Select country...',
        }}
        onChange={(_: any, value: any) => {
          if (!!value) {
            const country = filters.country || []
            const newValue = union(country, [value.id])
            setFilters({ country: newValue })
            if (document.activeElement) {
              // @ts-ignore
              document.activeElement.blur()
            }
          }
        }}
      />
      {isCountryUserType[user_type as UserType] && (
        <div className="absolute inset-0 top-0 z-10 -mt-1 bg-white bg-opacity-60"></div>
      )}
    </div>
  )
}

const YearSelect = (props: {
  maxYear: number
  minYear: number
  onChange: any
  range: [number, number]
}) => {
  const { maxYear, minYear, onChange, range } = props
  const { user_type } = useStore((state) => state.user.data)

  return (
    <div className="relative">
      <Field
        FieldProps={{ className: 'mb-0' }}
        label="Select a range of years"
        max={maxYear}
        min={minYear}
        value={range}
        widget="yearRange"
        onChange={onChange}
      />
      {isCountryUserType[user_type as UserType] && (
        <div className="absolute inset-0 top-0 z-10 -mt-1 bg-white bg-opacity-60"></div>
      )}
    </div>
  )
}

const DisplayAll = (props: any) => {
  const { displayAll, setDisplayAll, submissionApi } = props
  const { user_type } = useStore((state) => state.user.data)

  const toggleDisplayAll = () => {
    setDisplayAll(!displayAll)
  }

  useEffect(() => {
    if (displayAll) {
      submissionApi.setParams({ limit: null, offset: 0 })
    } else {
      submissionApi.setParams({ limit: SUBMISSIONS_PER_PAGE, offset: 0 })
    }
    // eslint-disable-next-line
  }, [displayAll])

  if (!userCanExportData[user_type as UserType]) {
    return null
  }

  return (
    <div className="relative flex items-center">
      <Switch
        id="display_all_countries"
        checked={displayAll}
        inputProps={{ 'aria-label': 'Switch demo' }}
        onChange={toggleDisplayAll}
      />
      <label
        className="text-pretty text-lg text-primary"
        htmlFor="display_all_countries"
      >
        Display All
      </label>
    </div>
  )
}

function CPFilters(props: any) {
  const { filters, maxYear, minYear, setFilters, submissionApi } = props

  return (
    <Box
      id="filters"
      className="sticky top-2 order-1 flex h-fit flex-col gap-6 rounded-lg p-8 lg:order-none print:hidden"
    >
      <div className="flex justify-end text-3xl font-light">
        <StatusLegend className="mb-0" />
      </div>
      <StatusFilter filters={filters} setFilters={setFilters} />
      <CountrySelect filters={filters} setFilters={setFilters} />
      <YearSelect
        maxYear={maxYear}
        minYear={minYear}
        range={filters.range}
        onChange={(value: number[]) => {
          debounce(() => {
            setFilters({ range: value })
          })
        }}
      />
      <div id="portalDisplayAll" className="flex flex-1"></div>
    </Box>
  )
}

const CPResources = ({ resources }: any) => {
  const { data, loading } = resources

  return (
    <Box
      id="resources"
      className="flex flex-col gap-6 rounded-lg p-8 print:hidden"
    >
      <Typography className="text-2xl font-medium">Resources</Typography>
      {!loading &&
        (!isEmpty(data) ? (
          <div className="flex max-h-56 flex-col overflow-y-auto">
            {entries(data).map((file) => {
              const formattedPath = split(file[1] as string, '.fs')[1]

              return (
                <DownloadLink
                  href={formatApiUrl(formattedPath)}
                  iconSize={18}
                  iconClassname="min-w-[18px] mb-1"
                >
                  <span
                    title={file[0]}
                    className="w-0 max-w-fit grow truncate text-[15px]"
                  >
                    {file[0]}
                  </span>
                </DownloadLink>
              )
            })}
          </div>
        ) : (
          <Typography className="text-lg">No resources available</Typography>
        ))}
    </Box>
  )
}

function useSubmissionSectionApi(filters: FiltersType) {
  const { data, loading, setParams } = useApi<ReportsResponse>({
    options: {
      params: {
        country_id: filters?.country?.join(','),
        limit: SUBMISSIONS_PER_PAGE,
        offset: 0,
        ordering: 'asc',
        show_all_per_group: true,
        status: filters.status,
        ...(filters.range.length == 2
          ? {
              year_max: filters.range[1],
              year_min: filters.range[0],
            }
          : {}),
      },
      withStoreCache: false,
    },
    path: 'api/country-programme/reports-by-country/',
  })
  const { count, loaded, results } = getResults(data)

  return { count, data, loaded, loading, results, setParams }
}

function useLogSectionApi(filters: FiltersType) {
  const { data, loading, setParams } = useApi<ReportsResponse>({
    options: {
      params: {
        country_id: filters?.country?.join(','),
        limit: LOGS_PER_PAGE,
        offset: 0,
        ordering: '-created_at',
        status: filters.status,
        ...(filters.range.length == 2
          ? {
              year_max: filters.range[1],
              year_min: filters.range[0],
            }
          : {}),
      },
      withStoreCache: false,
    },
    path: 'api/country-programme/reports/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

const useGetResourcesApi = () => {
  const { data, loading, setParams } = useApi({
    options: {
      params: {
        offset: 0,
      },
      withStoreCache: false,
    },
    path: '/api/country-programme/resources/',
  })
  return { data, loading, setParams }
}

export default function CPListing() {
  const { setActiveTab: setCpActiveTab } = useStore(
    (state) => state.cp_current_tab,
  )
  setCpActiveTab(0)
  const settings = useStore((state) => state.common.settings.data)
  const { user_type } = useStore((state) => state.user.data)

  const [activeTab, setActiveTab] = useState(0)

  const tabsEl = React.useRef<HTMLDivElement>(null)

  const minYear = settings.cp_reports.min_year
  const maxYear = settings.cp_reports.max_year
  const { filters, setFilters } = useStore((state) => state.filters)
  const submissionApi = useSubmissionSectionApi(filters)
  const logApi = useLogSectionApi(filters)
  const resources = useGetResourcesApi()

  const handleFiltersChange = (newFilters: FiltersType) => {
    const newFilterState = { ...filters, ...newFilters }
    setFilters(newFilterState)

    const newParams = {
      country_id: newFilterState?.country?.join(','),
      status: newFilterState.status,
      ...(newFilterState.range.length == 2
        ? {
            year_max: newFilterState.range[1],
            year_min: newFilterState.range[0],
          }
        : {}),
    }

    submissionApi.setParams(newParams)
    logApi.setParams(newParams)
  }

  return (
    <>
      <div className="container mb-6 flex items-center justify-end gap-x-6 lg:mb-4 lg:gap-x-4 print:hidden">
        {userCanSubmitReport[user_type as UserType] && (
          <Link
            className="px-4 py-2 text-lg uppercase"
            color="secondary"
            href="/country-programme/create"
            variant="contained"
            button
          >
            New submission
          </Link>
        )}
        {userCanExportData[user_type as UserType] && (
          <Link
            className="px-4 py-2 text-lg uppercase"
            color="secondary"
            href="/country-programme/export-data"
            variant="contained"
            button
          >
            Export
          </Link>
        )}
        {userCanExportData[user_type as UserType] && activeTab === 1 && (
          <Button
            className="px-4 py-2 text-lg uppercase"
            color="secondary"
            variant="contained"
            onClick={() => window.print()}
          >
            Print
          </Button>
        )}
      </div>
      <div
        id="cp-listing-sections"
        className="container relative flex flex-col-reverse gap-6 lg:grid lg:grid-cols-[auto_1fr] lg:gap-4 xl:px-0 print:px-0"
      >
        <div className="flex-1 lg:row-span-3">
          <div className="flex flex-wrap-reverse items-center justify-between gap-2 border-0 border-b border-solid border-primary lg:flex-nowrap print:hidden">
            <Tabs
              className="scrollable w-96"
              aria-label="view country programme report"
              ref={tabsEl}
              scrollButtons="auto"
              value={activeTab}
              variant="scrollable"
              TabIndicatorProps={{
                className: 'h-0',
                style: { transitionDuration: '150ms' },
              }}
              onChange={(event, newValue) => {
                setActiveTab(newValue)
              }}
              allowScrollButtonsMobile
            >
              <Tab
                id="submissions"
                className="rounded-b-none px-3 py-2"
                aria-controls="submissions"
                label="Submissions"
                classes={{
                  selected:
                    'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
                }}
              />
              {!isCountryUserType[user_type as UserType] && (
                <Tab
                  id="submissions-log"
                  className="rounded-b-none px-3 py-2"
                  aria-controls="submissions-log"
                  label="Submissions Log"
                  classes={{
                    selected:
                      'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
                  }}
                />
              )}
            </Tabs>
            <div id="portalSortBy" className="flex flex-1 justify-end"></div>
          </div>
          {activeTab === 0 && (
            <SubmissionSection
              filters={filters}
              maxYear={maxYear}
              minYear={minYear}
              setFilters={handleFiltersChange}
              submissionApi={submissionApi}
              user_type={user_type}
            />
          )}
          {activeTab === 1 && !isCountryUserType[user_type as UserType] && (
            <LogSection
              filters={filters}
              logApi={logApi}
              maxYear={maxYear}
              minYear={minYear}
              setFilters={handleFiltersChange}
              user_type={user_type}
            />
          )}
        </div>
        <CPFilters
          filters={filters}
          maxYear={maxYear}
          minYear={minYear}
          setFilters={handleFiltersChange}
          submissionApi={submissionApi}
        />
        <CPResources resources={resources} />
      </div>
    </>
  )
}
