'use client'
import type { RadioSelectProps } from '@ors/components/ui/RadioSelect/RadioSelect'
import type { SimpleSelectProps } from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { Country } from '@ors/types/store'
import { UserType, userTypeVisibility } from '@ors/types/user_types'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Box,
  Button,
  Grid,
  // InputAdornment,
  ListItem,
  // IconButton as MuiIconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { filter, union } from 'lodash'

import CPEmpty from '@ors/components/manage/Blocks/CountryProgramme/CPEmpty'
import Field from '@ors/components/manage/Form/Field'
import Listing from '@ors/components/manage/Form/Listing'
import Link from '@ors/components/ui/Link/Link'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import RadioSelect from '@ors/components/ui/RadioSelect/RadioSelect'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { getResults } from '@ors/helpers'
// import { scrollToElement } from '@ors/helpers/Utils/Utils'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { IoArrowForward, IoClose, IoFilter } from 'react-icons/io5'

interface SectionProps {
  currentSection?: number
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

const PER_PAGE_GENERAL = 48
const PER_PAGE_COUNTRY = 48
const PER_PAGE_YEAR = 100

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 500)
}

const SortBy = (props: Omit<SimpleSelectProps, 'label'>) => (
  <SimpleSelect label="Sort by" {...props} />
)
const GroupBy = (props: Omit<RadioSelectProps, 'label'>) => (
  <RadioSelect label="Group by" {...props} />
)

function Item({
  item,
  showCountry,
  showYear,
}: {
  item: ReportResponse
  showCountry: boolean
  showYear: boolean
}) {
  const showAll = !showCountry && !showYear
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const country = countries.filter(
    (country) => country.id === item.country_id,
  )[0]

  return (
    <ListItem
      className="group flex flex-col items-start justify-center"
      component={Grid}
      disablePadding
      item
      {...(showAll
        ? { lg: 3, md: 4, sm: 4, xl: 2, xs: 6 }
        : { lg: 6, md: 4, sm: 6, xl: 4, xs: 4 })}
    >
      <div className="flex max-w-full items-center px-4">
        <Tooltip
          enterDelay={300}
          placement="top-start"
          title={showAll ? item.name : showCountry ? item.country : item.year}
        >
          <div className="flex max-w-full items-center">
            <Link
              className={cx(
                'inline-block max-w-full font-semibold hover:text-primary md:truncate',
                {
                  'text-secondary': item.status === 'final',
                  'text-typography-secondary': !item.status,
                  'text-warning': item.status === 'draft',
                },
              )}
              prefetch={false}
              underline="hover"
              href={
                item.status === 'draft'
                  ? `/country-programme/${country?.iso3}/${item?.year}/edit`
                  : `/country-programme/${country?.iso3}/${item?.year}`
              }
            >
              {showAll && item.name}
              {!!showCountry && item.country}
              {!!showYear && item.year}
            </Link>
          </div>
        </Tooltip>
      </div>
    </ListItem>
  )
}

function GeneralSection(props: SectionProps) {
  // const shouldScroll = useRef(false)
  const listing = useRef<any>()
  const countries = useStore((state) => state.common.countries_for_listing.data)
  const countriesById = new Map<number, any>(
    countries.map((country: any) => [country.id, country]),
  )

  const { filters, groupBy, maxYear, minYear, setFilters, user_type } = props

  const perPage = groupBy === 'country' ? PER_PAGE_GENERAL : PER_PAGE_YEAR

  const [range, setRange] = useState([filters.range[0], filters.range[1]])
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: perPage,
  })
  const [ordering, setOrdering] = useState<'asc' | 'desc'>(
    groupBy === 'country' ? 'desc' : 'asc',
  )
  const orderField =
    groupBy === 'country' ? 'year,country__name' : 'country__name,year'

  const { data, loading, setParams } = useApi<ReportsResponse>({
    // onSuccess: () => {
    //   if (shouldScroll.current) {
    //     scrollToElement({ selectors: '#cp-listing-sections' })
    //   } else {
    //     shouldScroll.current = true
    //   }
    // },
    options: {
      params: {
        country_id: filters.country.join(','),
        limit: perPage,
        offset: 0,
        ordering: (ordering === 'asc' ? '' : '-') + orderField,
        year_max: filters.year.length > 0 ? filters.year[0] : range[1],
        year_min: filters.year.length > 0 ? filters.year[0] : range[0],
      },
      withStoreCache: true,
    },
    path: 'api/country-programme/reports/',
  })
  const { count, loaded, results } = getResults<ReportResponse>(data)

  const orderOptionsCountry = [
    {
      label: `Name, A to Z`,
      value: 'asc',
    },
    {
      label: `Name, Z to A`,
      value: 'desc',
    },
  ]
  const orderOptionsYear = [
    {
      label: `Year, ${maxYear} to ${minYear}`,
      value: 'desc',
    },
    {
      label: `Year, ${minYear} to ${maxYear}`,
      value: 'asc',
    },
  ]

  const orderOptions =
    groupBy === 'country' ? orderOptionsYear : orderOptionsCountry

  const handleOrderChange = (option: any) => {
    setOrdering(option.value)
    setPagination({ ...pagination, page: 1 })
    setParams({
      offset: 0,
      ordering: option.value === 'asc' ? orderField : `-${orderField}`,
    })
  }

  return (
    <div id="general-section">
      {user_type !== 'country_user' && (
        <div className="mb-4 flex min-h-[40px] items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <Field<Country>
              FieldProps={{ className: 'mb-0 w-full max-w-[200px]' }}
              getOptionLabel={(option) => (option as Country).name}
              options={countries}
              popupIcon={<IoFilter className="p-1" size={24} />}
              value={null}
              widget="autocomplete"
              Input={{
                placeholder: 'Select country...',
              }}
              sx={{
                '& .MuiAutocomplete-popupIndicator': { transform: 'none' },
                width: '100%',
              }}
              onChange={(_: any, value: any) => {
                if (!!value) {
                  const country = filters.country || []
                  const newValue = union(country, [value.id])
                  setFilters((filters: any) => {
                    return { ...filters, country: newValue }
                  })
                  setParams({
                    country_id: newValue.join(','),
                    offset: 0,
                  })
                  if (document.activeElement) {
                    // @ts-ignore
                    document.activeElement.blur()
                  }
                }
              }}
            />
            <Field
              FieldProps={{ className: 'mb-0 px-4' }}
              label="Date"
              max={maxYear}
              min={minYear}
              value={range}
              widget="range"
              onChange={(value: number[]) => {
                if (value[1] - value[0] >= 1) {
                  setRange(value)
                  debounce(() => {
                    setFilters((filters: any) => {
                      return { ...filters, range: value, year: [] }
                    })
                    setParams({
                      offset: 0,
                      year_max: value[1],
                      year_min: value[0],
                    })
                  })
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <SortBy options={orderOptions} onChange={handleOrderChange} />
          </div>
        </div>
      )}
      <div className="filters mb-6 flex flex-wrap gap-4">
        {filters.country.map((countryId: number) => (
          <Typography
            key={countryId}
            className="inline-flex items-center gap-2 rounded bg-gray-100 px-4 font-normal theme-dark:bg-gray-700/20"
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
                setFilters((filters: any) => {
                  return {
                    ...filters,
                    country: newValue,
                  }
                })
                listing.current.setPagination((pagination: any) => ({
                  ...pagination,
                  page: 1,
                }))
                setPagination((pagination) => ({ ...pagination, page: 1 }))
                setParams({
                  country_id: newValue.join(','),
                  offset: 0,
                })
              }}
            />
          </Typography>
        ))}
        {filters.year.map((year: string) => (
          <Typography
            key={year}
            className="inline-flex items-center gap-2 bg-gray-50 px-4 font-normal theme-dark:bg-gray-700/20"
            component="p"
            variant="h6"
          >
            {year}
            <IoClose
              className="cursor-pointer"
              size={20}
              onClick={() => {
                setFilters((filters: any) => {
                  const values = filters.year || []
                  return {
                    ...filters,
                    year: filter(values, (value) => value !== year),
                  }
                })
                listing.current.setPagination((pagination: any) => ({
                  ...pagination,
                  page: 1,
                }))
                setPagination((pagination) => ({ ...pagination, page: 1 }))
                setParams({
                  offset: 0,
                  year_max: year,
                  year_min: year,
                })
              }}
            />
          </Typography>
        ))}
        {(filters.range[0] > minYear || filters.range[1] < maxYear) && (
          <Typography
            className="inline-flex items-center gap-2 bg-gray-50 px-4 font-normal theme-dark:bg-gray-700/20"
            component="p"
            variant="h6"
          >
            {filters.range[0]} - {filters.range[1]}
            <IoClose
              className="cursor-pointer"
              size={20}
              onClick={() => {
                setFilters((filters: any) => {
                  setRange([minYear, maxYear])
                  return {
                    ...filters,
                    range: [minYear, maxYear],
                    year: [],
                  }
                })
                listing.current.setPagination((pagination: any) => ({
                  ...pagination,
                  page: 1,
                }))
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
      <Listing
        className="mb-6"
        GridProps={{ columnSpacing: 2, rowSpacing: 3 }}
        Item={Item}
        loaded={loaded}
        loading={loading}
        paginationPageSize={pagination.rowsPerPage}
        ref={listing}
        rowCount={count}
        rowData={results}
        onPaginationChanged={(page) => {
          setPagination((pagination) => ({ ...pagination, page }))
          setParams({
            limit: pagination.rowsPerPage,
            offset: ((page || 1) - 1) * pagination.rowsPerPage,
          })
        }}
        enableGrid
      />
    </div>
  )
}

function CountrySection(props: SectionProps) {
  // const shouldScroll = useRef(false)
  const { setFilters, user_type } = props
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

  const { data, loading, setParams } = useApi({
    // onSuccess: () => {
    //   if (shouldScroll.current) {
    //     scrollToElement({ selectors: '#cp-listing-sections' })
    //   } else {
    //     shouldScroll.current = true
    //   }
    // },
    options: {
      params: {
        limit: PER_PAGE_COUNTRY,
        offset: 0,
        ordering: 'asc',
      },
      withStoreCache: true,
    },
    path: 'api/country-programme/reports-by-country/',
  })
  const { count, loaded, results } = getResults(data)
  const pages = Math.ceil(count / pagination.rowsPerPage)

  const handleOrderChange = (option: any) => {
    setPagination({ ...pagination, page: 1 })
    setParams({ offset: 0, ordering: option.value })
  }

  if (countries.length === 1) {
    return <GeneralSection {...props} />
  }

  if (countries.length === 0) {
    return <CPEmpty text={`No reports found`} />
  }

  return (
    <div id="country-section">
      {user_type !== 'country_user' && (
        <div className="mb-4 flex min-h-[40px] items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <Field
              FieldProps={{ className: 'mb-0 w-full max-w-[200px]' }}
              getOptionLabel={(option: any) => option?.name}
              options={countries}
              popupIcon={<IoFilter className="p-1" size={24} />}
              value={null}
              widget="autocomplete"
              Input={{
                placeholder: 'Select country...',
              }}
              sx={{
                '& .MuiAutocomplete-popupIndicator': { transform: 'none' },
                width: '100%',
              }}
              onChange={(_: any, value: any) => {
                if (!!value) {
                  setFilters((filters: any) => {
                    const country = filters.country || []
                    return { ...filters, country: union(country, [value.id]) }
                  })
                }
              }}
            />
          </div>
          <SortBy options={orderOptions} onChange={handleOrderChange} />
        </div>
      )}
      <Grid className="mb-6" spacing={4} container>
        {results.map((row: any) => (
          <Grid key={row.id} lg={3} sm={6} xs={12} item>
            <Box className="h-full p-2">
              <Typography
                className="my-3 inline-flex cursor-pointer items-center gap-2 px-4 text-xl font-bold"
                component="p"
                variant="h6"
                onClick={() => {
                  setFilters((filters: any) => {
                    const country = filters.country || []
                    return { ...filters, country: union(country, [row.id]) }
                  })
                }}
              >
                {row.group}
                <IoArrowForward size={20} />
              </Typography>
              <hr className="mx-4 mb-6 border-b-0 border-gray-50/25" />
              <Listing
                className="mb-3"
                Item={Item}
                ItemProps={{ showYear: true }}
                loaded={loaded}
                loading={loading}
                rowCount={row.reports.length}
                rowData={row.reports}
                enableGrid
              />
              {row.count > row.reports.length && (
                <Button
                  variant="text"
                  onClick={() => {
                    setFilters((filters: any) => {
                      const country = filters.country || []
                      return {
                        ...filters,
                        country: union(country, [row.id]),
                      }
                    })
                  }}
                >
                  View more...
                </Button>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
      {!!pages && pages > 1 && (
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
      )}
    </div>
  )
}

function YearSection(props: SectionProps) {
  const { filters, maxYear, minYear, setFilters } = props
  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: PER_PAGE_YEAR,
  })
  const [range, setRange] = useState<number[]>([
    filters.range[0],
    filters.range[1],
  ])
  const { setActiveTab } = useStore((state) => state.cp_current_tab)
  const { data, loading, setParams } = useApi({
    options: {
      params: {
        limit: PER_PAGE_YEAR,
        offset: 0,
        ordering: 'desc',
      },
      withStoreCache: true,
    },
    path: 'api/country-programme/reports-by-year/',
  })
  const { count, loaded, results } = getResults(data)
  const pages = Math.ceil(count / pagination.rowsPerPage)

  const orderOptions = [
    { label: `Year, ${maxYear} to ${minYear}`, value: 'desc' },
    { label: `Year, ${minYear} to ${maxYear}`, value: 'asc' },
  ]

  const handleOrderChange = (option: any) => {
    setPagination({ ...pagination, page: 1 })
    setParams({ offset: 0, ordering: option.value })
  }

  useEffect(() => {
    if (filters.range[0] !== range[0] || filters.range[1] !== range[1]) {
      setRange(filters.range)
    }
    /* eslint-disable-next-line */
  }, [filters.range])

  useEffect(() => {
    // Reset active tab.
    setActiveTab(0)
  }, [])

  return (
    <div id="year-section">
      <div className="mb-4 flex min-h-[40px] items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <Field
            FieldProps={{ className: 'mb-0 px-4' }}
            label="Date"
            max={maxYear}
            min={minYear}
            value={range}
            widget="range"
            onChange={(value: number[]) => {
              if (value[1] - value[0] >= 1) {
                setRange(value)
                debounce(() => {
                  setFilters((filters: any) => {
                    return { ...filters, range: value, year: [] }
                  })
                })
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <SortBy options={orderOptions} onChange={handleOrderChange} />
        </div>
      </div>
      <Grid className="mb-6" spacing={4} container>
        {results.map((row: any) => (
          <Grid key={row.id} lg={3} sm={6} xs={12} item>
            <Box className="h-full p-2">
              <Typography
                className="mb-4 inline-flex cursor-pointer items-center gap-2 px-4 font-normal"
                component="p"
                variant="h6"
                onClick={() => {
                  setFilters((filters: any) => {
                    const year = filters.year || []
                    return { ...filters, year: union(year, [row.group]) }
                  })
                }}
              >
                {row.group}
                <IoArrowForward size={20} />
              </Typography>
              <Listing
                className="mb-3"
                Item={Item}
                ItemProps={{ showCountry: true }}
                loaded={loaded}
                loading={loading}
                rowCount={row.reports.length}
                rowData={row.reports}
                enableGrid
              />
              {row.count > row.reports.length && (
                <Button
                  variant="text"
                  onClick={() => {
                    setFilters((filters: any) => {
                      const year = filters.year || []
                      return { ...filters, year: union(year, [row.group]) }
                    })
                  }}
                >
                  View more...
                </Button>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
      {!!pages && pages > 1 && (
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
      )}
    </div>
  )
}

export const sections = [
  {
    id: 'section-country',
    component: CountrySection,
    groupBy: 'country',
    label: 'Country',
    panelId: 'section-country-panel',
  },
  {
    id: 'section-year',
    component: YearSection,
    groupBy: 'year',
    label: 'Year',
    panelId: 'section-year-panel',
  },
]

function SectionPanel(props: SectionProps) {
  const {
    currentSection,
    filters,
    maxYear,
    minYear,
    section = 0,
    setFilters,
    user_type,
    ...rest
  } = props

  const hasFilters = useMemo(
    () =>
      filters.country.length > 0 ||
      filters.year.length > 0 ||
      filters.range[0] > minYear ||
      filters.range[1] < maxYear,
    [filters, minYear, maxYear],
  )

  const Section: React.FC<any> = !hasFilters
    ? sections[section].component
    : GeneralSection

  return (
    <div
      id={sections[section].panelId}
      aria-labelledby={sections[section].id}
      hidden={currentSection !== section}
      role="tabpanel"
      {...rest}
    >
      <Section
        filters={filters}
        groupBy={sections[section].groupBy}
        maxYear={maxYear}
        minYear={minYear}
        setFilters={setFilters}
        user_type={user_type}
      />
    </div>
  )
}

export default function CPListing() {
  const settings = useStore((state) => state.common.settings.data)
  const [activeSection, setActiveSection] = useState(0)
  const { user_type } = useStore((state) => state.user.data)

  const minYear = settings.cp_reports.min_year
  const maxYear = settings.cp_reports.max_year
  const [filters, setFilters] = useState({
    country: [],
    range: [minYear, maxYear],
    year: [],
  })

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-x-4">
        <div className="flex flex-col gap-x-4">
          {user_type !== 'country_user' && (
            <GroupBy
              className="text-xl"
              initialIndex={activeSection}
              options={sections}
              onChange={(_: any, index: number) => setActiveSection(index)}
            />
          )}
        </div>
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
      <div id="cp-listing-sections">
        {sections.map((section, index) => (
          <SectionPanel
            key={section.id}
            currentSection={activeSection}
            filters={filters}
            maxYear={maxYear}
            minYear={minYear}
            section={index}
            setFilters={setFilters}
            user_type={user_type}
          />
        ))}
      </div>
    </>
  )
}
