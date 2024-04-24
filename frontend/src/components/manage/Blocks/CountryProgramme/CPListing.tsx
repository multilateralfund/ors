'use client'
import type { SimpleSelectProps } from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { Country } from '@ors/types/store'
import { UserType, userTypeVisibility } from '@ors/types/user_types'

import React, { useMemo, useState } from 'react'

import {
  Box,
  Skeleton,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { filter, times, union } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import Portal from '../../Utils/Portal'

import { IoChevronDownCircle, IoClose, IoEllipse } from 'react-icons/io5'

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

type StatusFilterTypes = 'all' | 'draft' | 'final'

type FiltersType = {
  country: Country[]
  range: [number, number]
  status: StatusFilterTypes
}

const PER_PAGE_COUNTRY = 12
const REPORTS_PER_COUNTRY = 6

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 500)
}

const SortBy = (props: Omit<SimpleSelectProps, 'label'>) => (
  <SimpleSelect label="Sort by" {...props} />
)

const CountryItem = (props: any) => {
  const { group, loaded, loading, reports } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )
  const [showAllReports, setShowAllReports] = useState(false)

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
  const toggleReportsVisibility = () => {
    setShowAllReports(!showAllReports)
  }

  return (
    <div
      className={`transition-opacity flex w-full flex-col gap-4 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
    >
      <Typography variant="h5">{group}</Typography>
      <div className="grid w-full grid-flow-row auto-rows-max gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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

          const country = countriesById.get(report.country_id)

          return (
            <Link
              key={index}
              className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 pb-2 sm:min-w-60"
              underline="none"
              href={
                report.status === 'draft'
                  ? `/country-programme/${country?.iso3}/${report.year}/edit`
                  : `/country-programme/${country?.iso3}/${report.year}`
              }
            >
              <>
                <Typography className="text-lg font-semibold" color="secondary">
                  {report.year}
                </Typography>
                <div className="flex items-baseline gap-2">
                  <Typography>
                    <IoEllipse color={statusDot} size={12} />
                  </Typography>
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

      {reports.length > REPORTS_PER_COUNTRY && (
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

const CountrySection = function CountrySection(
  props: SectionProps & { countryApi: any },
) {
  const { countryApi, filters, maxYear, minYear, setFilters, user_type } = props
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PER_PAGE_COUNTRY,
  })

  const orderOptions = [
    { label: 'Name, A to Z', value: 'asc' },
    { label: 'Name, Z to A', value: 'desc' },
  ]

  const countries = useStore((state) => {
    return state.common.countries_for_listing.data
  })
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

  const { count, loaded, loading, results, setParams } = countryApi

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
    <div id="country-section" className="relative">
      <Loading
        className="bg-mui-box-background/70 !duration-300"
        active={loading}
      />
      <Portal active={user_type !== 'country_user'} domNode="portalSortBy">
        <SortBy options={orderOptions} onChange={handleOrderChange} />
      </Portal>
      <div className="my-6 flex gap-4">
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
                setPagination((pagination) => ({ ...pagination, page: 1 }))
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
                  year: [],
                })
                setPagination((pagination) => ({ ...pagination, page: 1 }))
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
      <div
        className={`transition-opacity mb-10 flex w-full max-w-screen-xl flex-col gap-8 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
      >
        {memoResults.map((countryData: any) => {
          if (countryData.isSkeleton)
            return (
              <div key={countryData.id} className="flex flex-col gap-6">
                <Skeleton height={40} variant="text" width="100%" />
                <div className="grid w-full grid-flow-row auto-rows-max gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {times(REPORTS_PER_COUNTRY, (index) => (
                    <div
                      key={index}
                      className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 p-2 sm:min-w-60"
                    >
                      <Skeleton height={40} variant="text" width="100%" />
                    </div>
                  ))}
                </div>
              </div>
            )
          return (
            <CountryItem
              key={countryData.id}
              group={countryData.group}
              loaded={loaded}
              loading={loading}
              reports={countryData.reports}
            />
          )
        })}
      </div>
      {!!pages && pages > 1 && (
        <div className="flex items-center justify-center">
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

const LogItem = (props: any) => {
  const { loaded, loading, reports } = props
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

  const FormattedDateTime = ({ dateObject }: { dateObject: any }) => {
    const dateTime = new Date(dateObject)
    const date = dateTime.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    })
    const time = dateTime.toLocaleTimeString(undefined, {
      hour: 'numeric',
      hour12: false,
      minute: 'numeric',
    })

    return (
      <>
        <Typography>{date}</Typography>
        <Typography>{time}</Typography>
      </>
    )
  }

  return (
    <div
      className={`transition-opacity flex w-full flex-col gap-8 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex w-full flex-col gap-4">
        {reports.map((report: any, index: number) => {
          const dateObject = new Date(report.created_at)

          const statusDot = report.status === 'final' ? '#4191CD' : '#EE8E34'
          const country = countriesById.get(report.country_id)

          return (
            <Link
              key={index}
              className="flex flex-col gap-2 text-pretty border-0 border-b border-solid border-blue-600 pb-4 sm:min-w-60"
              underline="none"
              href={
                report.status === 'draft'
                  ? `/country-programme/${country?.iso3}/${report.year}/edit`
                  : `/country-programme/${country?.iso3}/${report.year}`
              }
            >
              <Typography variant="h5">{report.country}</Typography>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Typography
                    className="mr-2 text-lg font-semibold"
                    color="secondary"
                  >
                    {report.year}
                  </Typography>
                  <div className="flex items-baseline gap-2">
                    <Typography>
                      <IoEllipse color={statusDot} size={12} />
                    </Typography>
                    <Typography className="text-nowrap font-medium">
                      VERSION {report.version}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md bg-white p-0.5">
                  <Typography>Submitted by ({report.created_by}) on</Typography>
                  <FormattedDateTime dateObject={dateObject} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
//eslint-disable-next-line
const LogSection = function LogSection(props: SectionProps & { logApi: any }) {
  const { filters, logApi, maxYear, minYear, setFilters } = props
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PER_PAGE_COUNTRY,
  })

  const countries = useStore((state) => {
    return state.common.countries_for_listing.data
  })
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

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
      <div className="my-6 flex gap-4">
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
                setPagination((pagination) => ({ ...pagination, page: 1 }))
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
                  year: [],
                })
                setPagination((pagination) => ({ ...pagination, page: 1 }))
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
      <div
        className={`transition-opacity mb-10 flex w-full max-w-screen-xl flex-col gap-12 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
      >
        {memoResults.map((countryData: any) => {
          if (countryData.isSkeleton)
            return (
              <div key={countryData.id} className="flex flex-col gap-8">
                <Skeleton height={40} variant="text" width="100%" />
                <div className="grid w-full grid-flow-row auto-rows-max gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {times(REPORTS_PER_COUNTRY, (index) => (
                    <div
                      key={index}
                      className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 p-2 sm:min-w-60"
                    >
                      <Skeleton height={40} variant="text" width="100%" />
                    </div>
                  ))}
                </div>
              </div>
            )

          return (
            <LogItem
              key={countryData.id}
              loaded={loaded}
              loading={loading}
              reports={countryData.reports}
            />
          )
        })}
      </div>
      {!!pages && pages > 1 && (
        <div className="flex items-center justify-center">
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
  // take into account 'user_type'
  const countries = useStore((state) => state.common.countries_for_listing.data)

  return (
    <Field<Country>
      FieldProps={{ className: 'mb-0 w-full CPListing' }}
      getOptionLabel={(option) => (option as Country).name}
      options={countries}
      popupIcon={<IoChevronDownCircle color="black" size={24} />}
      value={null}
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
  )
}

const YearSelect = (props: {
  maxYear: number
  minYear: number
  onChange: any
  range: [number, number]
}) => {
  const { maxYear, minYear, onChange, range } = props

  return (
    <Field
      FieldProps={{ className: 'mb-0 px-4' }}
      label="Date"
      max={maxYear}
      min={minYear}
      value={range}
      widget="range"
      onChange={onChange}
    />
  )
}

function CPFilters(props: any) {
  const { filters, maxYear, minYear, setFilters } = props

  return (
    <Box
      id="filters"
      className="sticky top-2 flex h-fit flex-col gap-6 rounded-lg p-8"
    >
      <Typography className="text-3xl font-light">Filters</Typography>
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
    </Box>
  )
}

function useCountrySectionApi(filters: FiltersType) {
  const { data, loading, setParams } = useApi<ReportsResponse>({
    options: {
      params: {
        limit: PER_PAGE_COUNTRY,
        offset: 0,
        ordering: 'asc',
        show_all_per_group: true,
        status: filters.status,
      },
      withStoreCache: true,
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
        limit: PER_PAGE_COUNTRY,
        offset: 0,
        ordering: 'asc',
        show_all_per_group: true,
        status: filters.status,
      },
      withStoreCache: true,
    },
    path: 'api/country-programme/reports-by-country/',
  })
  const { count, loaded, results } = getResults(data)
  return { count, data, loaded, loading, results, setParams }
}

export default function CPListing() {
  const settings = useStore((state) => state.common.settings.data)
  const { user_type } = useStore((state) => state.user.data)

  const [activeTab, setActiveTab] = useState(0)

  const tabsEl = React.useRef<HTMLDivElement>(null)

  const minYear = settings.cp_reports.min_year
  const maxYear = settings.cp_reports.max_year
  const [filters, setFilters] = useState<FiltersType>({
    country: [],
    range: [minYear, maxYear],
    status: 'all',
  })
  const countryApi = useCountrySectionApi(filters)
  const logApi = useLogSectionApi(filters)

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

    countryApi.setParams(newParams)
    logApi.setParams(newParams)
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-x-4">
        {userTypeVisibility[user_type as UserType] && (
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
      </div>
      <div
        id="cp-listing-sections"
        className="relative flex flex-col-reverse gap-4 md:flex-row"
      >
        <div className="flex-1">
          <div className="flex flex-wrap-reverse gap-2 md:flex-nowrap items-center justify-between border-0 border-b border-solid border-primary">
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
            </Tabs>
            <div id="portalSortBy" className="flex-1 flex justify-end"></div>
          </div>
          {activeTab === 0 && (
            <CountrySection
              countryApi={countryApi}
              filters={filters}
              maxYear={maxYear}
              minYear={minYear}
              setFilters={handleFiltersChange}
              user_type={user_type}
            />
          )}
          {activeTab === 1 && (
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
          user_type={user_type}
        />
      </div>
    </>
  )
}
