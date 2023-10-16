'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  Box,
  Button,
  Grid,
  // InputAdornment,
  ListItem,
  // IconButton as MuiIconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import {
  filter,
  groupBy,
  includes,
  isArray,
  keys,
  maxBy,
  minBy,
  orderBy,
  slice,
  union,
} from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import Listing from '@ors/components/manage/Form/Listing'
import IconButton from '@ors/components/ui/IconButton/IconButton'
import Link from '@ors/components/ui/Link/Link'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'

import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoFilter } from '@react-icons/all-files/io5/IoFilter'

interface SectionProps {
  countries: any
  curentSection?: number
  filters: any
  groupBy?: string
  maxYear: any
  minYear: any
  reports: any
  reportsByCountry: any
  reportsByYear: any
  section?: number
  setFilters: any
  years: any
}

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 500)
}

function Item({ item, showCountry, showYear }: any) {
  const showAll = !showCountry && !showYear

  return (
    <ListItem
      className={cx('group flex flex-col items-start justify-center')}
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
              className="inline-block max-w-full text-typography-secondary hover:text-primary md:truncate"
              href={`/country-programme/${item.id}`}
              underline="hover"
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
  const listing = useRef<any>()
  const { countries, filters, groupBy, maxYear, minYear, reports, setFilters } =
    props
  const [range, setRange] = useState([filters.range[0], filters.range[1]])
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 100 })
  const [ordering, setOrdering] = useState<'asc' | 'desc'>(
    groupBy === 'country' ? 'asc' : 'desc',
  )

  const filteredReports = useMemo(
    () =>
      filter(reports, (report) => {
        const includesCountry =
          filters.country.length > 0
            ? includes(filters.country, report.country)
            : true
        const includesYear =
          filters.year.length > 0 ? includes(filters.year, report.year) : true
        return (
          includesCountry &&
          includesYear &&
          report.year >= filters.range[0] &&
          report.year <= filters.range[1]
        )
      }),
    [reports, filters],
  )

  const rows = useMemo(
    () =>
      slice(
        orderBy(
          filteredReports,
          groupBy === 'country' ? ['country', 'year'] : ['year', 'country'],
          groupBy === 'country' ? [ordering, 'desc'] : [ordering, 'asc'],
        ),
        (pagination.page - 1) * pagination.rowsPerPage,
        pagination.page * pagination.rowsPerPage,
      ),
    [filteredReports, pagination, ordering, groupBy],
  )

  return (
    <>
      <div className="mb-4 flex justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <Field
            FieldProps={{ className: 'mb-0 w-full max-w-[200px]' }}
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
            onChange={(event: Event, value: number | number[]) => {
              if (isArray(value) && value[1] - value[0] >= 1) {
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
          <Typography className="text-typography-secondary" component="span">
            Ordering
          </Typography>
          <IconButton
            onClick={() => {
              if (ordering === 'asc') {
                setOrdering('desc')
              } else {
                setOrdering('asc')
              }
            }}
          >
            {ordering === 'asc' ? (
              <IoArrowUp size="1rem" />
            ) : (
              <IoArrowDown size="1rem" />
            )}
          </IconButton>
        </div>
      </div>
      <div className="filters mb-6 flex flex-wrap gap-4">
        {filters.country.map((country: string) => (
          <Typography
            key={country}
            className="inline-flex items-center gap-2 rounded bg-gray-100 px-4 font-normal theme-dark:bg-gray-700/20"
            component="p"
            variant="h6"
          >
            {country}
            <IoClose
              className="cursor-pointer"
              size={20}
              onClick={() => {
                setFilters((filters: any) => {
                  const values = filters.country || []
                  return {
                    ...filters,
                    country: filter(values, (value) => value !== country),
                  }
                })
                listing.current.setPagination((pagination: any) => ({
                  ...pagination,
                  page: 1,
                }))
                setPagination((pagination) => ({ ...pagination, page: 1 }))
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
              }}
            />
          </Typography>
        )}
      </div>
      <Listing
        className="mb-6"
        GridProps={{ columnSpacing: 2, rowSpacing: 3 }}
        Item={Item}
        enableLoader={false}
        loaded={true}
        loading={false}
        paginationPageSize={42}
        ref={listing}
        rowCount={filteredReports.length}
        rowData={rows}
        onPaginationChanged={(page) =>
          setPagination((pagination) => ({ ...pagination, page }))
        }
        enableGrid
      />
    </>
  )
}

function CountrySection(props: SectionProps) {
  const { countries, reportsByCountry, setFilters } = props
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 32 })
  const [ordering, setOrdering] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(
    () =>
      slice(
        orderBy(countries, 'id', ordering),
        (pagination.page - 1) * pagination.rowsPerPage,
        pagination.page * pagination.rowsPerPage,
      ),
    [countries, pagination, ordering],
  )

  const pages = useMemo(
    () => Math.ceil(countries.length / pagination.rowsPerPage),
    [countries, pagination],
  )

  return (
    <>
      <div className="mb-4 flex justify-between gap-4">
        <Field
          FieldProps={{ className: 'mb-0 w-full max-w-[200px]' }}
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
        <div className="flex items-center gap-2">
          <Typography className="text-typography-secondary" component="span">
            Ordering
          </Typography>
          <IconButton
            onClick={() => {
              if (ordering === 'asc') {
                setOrdering('desc')
              } else {
                setOrdering('asc')
              }
              setPagination({ ...pagination, page: 1 })
            }}
          >
            {ordering === 'asc' ? (
              <IoArrowUp size="1rem" />
            ) : (
              <IoArrowDown size="1rem" />
            )}
          </IconButton>
        </div>
      </div>
      <Grid className="mb-6" spacing={4} container>
        {rows.map((row: any) => (
          <Grid key={row.id} lg={3} sm={6} xs={12} item>
            <Box className="h-full p-2">
              <Typography
                className="mb-4 inline-flex cursor-pointer items-center gap-2 px-4 font-normal"
                component="p"
                variant="h6"
                onClick={() => {
                  setFilters((filters: any) => {
                    const country = filters.country || []
                    return { ...filters, country: union(country, [row.id]) }
                  })
                }}
              >
                {row.label}
                <IoArrowForward size={20} />
              </Typography>
              <Listing
                className="mb-3"
                Item={Item}
                ItemProps={{ showYear: true }}
                enableLoader={false}
                enablePagination={false}
                loaded={true}
                loading={false}
                rowCount={reportsByCountry[row.id].length}
                rowData={slice(reportsByCountry[row.id], 0, 9)}
                enableGrid
              />
              {reportsByCountry[row.id].length > 9 && (
                <Button
                  variant="text"
                  onClick={() => {
                    setFilters((filters: any) => {
                      const country = filters.country || []
                      return { ...filters, country: union(country, [row.id]) }
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
      <Pagination
        count={pages}
        page={pagination.page}
        siblingCount={1}
        onPaginationChanged={(page) => {
          setPagination({ ...pagination, page: page || 1 })
        }}
      />
    </>
  )
}

function YearSection(props: SectionProps) {
  const { filters, maxYear, minYear, reportsByYear, setFilters, years } = props
  const [range, setRange] = useState([filters.range[0], filters.range[1]])
  const [ordering, setOrdering] = useState<'asc' | 'desc'>('desc')

  const rows = useMemo(
    () => slice(orderBy(years, 'id', ordering)),
    [years, ordering],
  )

  useEffect(() => {
    if (filters.range[0] !== range[0] || filters.range[1] !== range[1]) {
      setRange(filters.range)
    }
    /* eslint-disable-next-line */
  }, [filters.range])

  return (
    <>
      <div className="mb-6 flex justify-between gap-4">
        <Field
          FieldProps={{ className: 'mb-0 px-4' }}
          label="Date"
          max={maxYear}
          min={minYear}
          value={range}
          widget="range"
          onChange={(event: Event, value: number | number[]) => {
            if (isArray(value) && value[1] - value[0] >= 1) {
              setRange(value)
              debounce(() => {
                setFilters((filters: any) => {
                  return { ...filters, range: value, year: [] }
                })
              })
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Typography className="text-typography-secondary" component="span">
            Ordering
          </Typography>
          <IconButton
            onClick={() => {
              if (ordering === 'asc') {
                setOrdering('desc')
              } else {
                setOrdering('asc')
              }
            }}
          >
            {ordering === 'asc' ? (
              <IoArrowUp size="1rem" />
            ) : (
              <IoArrowDown size="1rem" />
            )}
          </IconButton>
        </div>
      </div>
      <Grid className="mb-6" spacing={4} container>
        {rows.map((row: any) => (
          <Grid key={row.id} lg={3} sm={6} xs={12} item>
            <Box className="h-full p-2">
              <Typography
                className="mb-4 inline-flex cursor-pointer items-center gap-2 px-4 font-normal"
                component="p"
                variant="h6"
                onClick={() => {
                  setFilters((filters: any) => {
                    const year = filters.year || []
                    return { ...filters, year: union(year, [row.id]) }
                  })
                }}
              >
                {row.label}
                <IoArrowForward size={20} />
              </Typography>
              <Listing
                className="mb-3"
                Item={Item}
                ItemProps={{ showCountry: true }}
                enableLoader={false}
                enablePagination={false}
                loaded={true}
                loading={false}
                rowCount={reportsByYear[row.id].length}
                rowData={slice(reportsByYear[row.id], 0, 9)}
                enableGrid
              />
              {reportsByYear[row.id].length > 9 && (
                <Button
                  variant="text"
                  onClick={() => {
                    setFilters((filters: any) => {
                      const year = filters.year || []
                      return { ...filters, year: union(year, [row.id]) }
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
    </>
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
    countries,
    curentSection,
    filters,
    maxYear,
    minYear,
    reports,
    reportsByCountry,
    reportsByYear,
    section = 0,
    setFilters,
    years,
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
      hidden={curentSection !== section}
      role="tabpanel"
      {...rest}
    >
      <Section
        countries={countries}
        filters={filters}
        groupBy={sections[section].groupBy}
        maxYear={maxYear}
        minYear={minYear}
        reports={reports}
        reportsByCountry={reportsByCountry}
        reportsByYear={reportsByYear}
        setFilters={setFilters}
        years={years}
      />
    </div>
  )
}

export default function CPListing(props: { reports?: any }) {
  // TODO: use real pagination
  const { reports } = props
  const [activeSection, setActiveSection] = useState(0)
  const reportsByCountry = useMemo(
    () => groupBy(orderBy(reports, 'year', 'desc'), 'country'),
    [reports],
  )
  const reportsByYear = useMemo(
    () => groupBy(orderBy(reports, 'country', 'asc'), 'year'),
    [reports],
  )
  const countries = useMemo(
    () =>
      orderBy(
        keys(reportsByCountry).map((country) => ({
          id: country,
          label: country,
        })),
        'id',
        'asc',
      ),
    [reportsByCountry],
  )
  const years = useMemo(
    () =>
      orderBy(
        keys(reportsByYear).map((year) => ({
          id: parseInt(year),
          label: parseInt(year),
        })),
        'id',
        'desc',
      ),
    [reportsByYear],
  )
  const minYear = useMemo(() => minBy(years, 'id')?.id, [years])
  const maxYear = useMemo(() => maxBy(years, 'id')?.id, [years])
  const [filters, setFilters] = useState({
    country: [],
    range: [minYear, maxYear],
    year: [],
  })

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-x-4">
        <div className="flex items-center gap-x-4">
          <Typography className="text-xl font-medium text-typography-secondary">
            Group by:
          </Typography>
          <Tabs
            aria-label="country programme listing"
            value={activeSection}
            onChange={(event: React.SyntheticEvent, newSection: number) => {
              setActiveSection(newSection)
              setFilters({ country: [], range: [minYear, maxYear], year: [] })
            }}
          >
            {sections.map((section) => (
              <Tab
                key={section.id}
                aria-controls={section.panelId}
                label={section.label}
                disableRipple
              />
            ))}
          </Tabs>
        </div>
        <Link href="/country-programme/create" variant="contained" button>
          New submission
        </Link>
      </div>
      <Box>
        {sections.map((section, index) => (
          <SectionPanel
            key={section.id}
            countries={countries}
            curentSection={activeSection}
            filters={filters}
            maxYear={maxYear}
            minYear={minYear}
            reports={reports}
            reportsByCountry={reportsByCountry}
            reportsByYear={reportsByYear}
            section={index}
            setFilters={setFilters}
            years={years}
          />
        ))}
      </Box>
    </>
  )
}
