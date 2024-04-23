'use client'
import type { SimpleSelectProps } from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { Country } from '@ors/types/store'
import { UserType, userTypeVisibility } from '@ors/types/user_types'

import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

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

import { IoChevronDownCircle, IoClose, IoEllipse } from 'react-icons/io5'

interface SectionProps {
  filters: any
  groupBy?: string
  maxYear: any
  minYear: any
  section?: number
  setFilters: any
  setRange?: any
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
  year: number[]
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

// interface ItemLinkProps {
//   className?: string
//   country: any
//   item: ReportResponse
//   showAll: boolean
//   showCountry: boolean
//   showYear: boolean
// }
//
// const ItemLink = ({
//   className,
//   country,
//   item,
//   showAll,
//   showCountry,
//   showYear,
// }: ItemLinkProps) => {
//   return (
//     <Link
//       className={cx(
//         'flex w-full items-center text-wrap font-semibold hover:text-primary',
//         className,
//         {
//           'text-secondary': item.status === 'final',
//           'text-typography-secondary': !item.status,
//           'text-warning': item.status === 'draft',
//         },
//       )}
//       prefetch={false}
//       underline="hover"
//       href={
//         item.status === 'draft'
//           ? `/country-programme/${country?.iso3}/${item?.year}/edit`
//           : `/country-programme/${country?.iso3}/${item?.year}`
//       }
//     >
//       {showAll && item.name}
//       {!!showCountry && item.country}
//       {!!showYear && item.year}
//     </Link>
//   )
// }
//
// interface ItemProps {
//   ItemRenderer: (props: ItemLinkProps) => React.ReactElement
//   item: ReportResponse
//   showCountry: boolean
//   showYear: boolean
// }
//
// function Item({
//   ItemRenderer = ItemLink,
//   item,
//   showCountry,
//   showYear,
// }: ItemProps) {
//   const showAll = !showCountry && !showYear
//   const countries = useStore((state) => state.common.countries_for_listing.data)
//   const country = countries.filter(
//     (country) => country.id === item.country_id,
//   )[0]
//
//   return (
//     <Tooltip
//       enterDelay={300}
//       placement="top-start"
//       title={showAll ? item.name : showCountry ? item.country : item.year}
//     >
//       <ItemRenderer
//         country={country}
//         item={item}
//         showAll={showAll}
//         showCountry={showCountry}
//         showYear={showYear}
//       />
//     </Tooltip>
//   )
// }
//
// const GeneralSectionItemLink = (props: ItemLinkProps) => (
//   <ItemLink
//     className="shadow-mlfs justify-center rounded-md px-6 py-4 text-center text-lg"
//     {...omit(props, ['className'])}
//   />
// )
//
// const GeneralSectionItem = (props: ItemProps) => (
//   <Item
//     ItemRenderer={GeneralSectionItemLink}
//     {...omit(props, ['ItemRenderer'])}
//   />
// )

// function GeneralSection(props: SectionProps) {
//   // const shouldScroll = useRef(false)
//   const listing = useRef<any>()
//   const countries = useStore((state) => state.common.countries_for_listing.data)
//   const countriesById = new Map<number, any>(
//     countries.map((country: any) => [country.id, country]),
//   )
//
//   const { filters, groupBy, maxYear, minYear, setFilters, user_type } = props
//
//   const perPage = groupBy === 'country' ? PER_PAGE_GENERAL : PER_PAGE_YEAR
//
//   const [range, setRange] = useState([filters.range[0], filters.range[1]])
//   const [pagination, setPagination] = useState({
//     page: 1,
//     rowsPerPage: perPage,
//   })
//   const [ordering, setOrdering] = useState<'asc' | 'desc'>(
//     groupBy === 'country' ? 'desc' : 'asc',
//   )
//   const orderField =
//     groupBy === 'country' ? 'year,country__name' : 'country__name,year'
//
//   const { data, loading, setParams } = useApi<ReportsResponse>({
//     options: {
//       params: {
//         country_id: filters.country.join(','),
//         limit: perPage,
//         offset: 0,
//         ordering: (ordering === 'asc' ? '' : '-') + orderField,
//         year_max: filters.year.length > 0 ? filters.year[0] : range[1],
//         year_min: filters.year.length > 0 ? filters.year[0] : range[0],
//       },
//       withStoreCache: true,
//     },
//     path: 'api/country-programme/reports/',
//   })
//   const { count, loaded, results } = getResults<ReportResponse>(data)
//
//   const orderOptionsCountry = [
//     {
//       label: `Name, A to Z`,
//       value: 'asc',
//     },
//     {
//       label: `Name, Z to A`,
//       value: 'desc',
//     },
//   ]
//   const orderOptionsYear = [
//     {
//       label: `Year, ${maxYear} to ${minYear}`,
//       value: 'desc',
//     },
//     {
//       label: `Year, ${minYear} to ${maxYear}`,
//       value: 'asc',
//     },
//   ]
//
//   const orderOptions =
//     groupBy === 'country' ? orderOptionsYear : orderOptionsCountry
//
//   const handleOrderChange = (option: any) => {
//     setOrdering(option.value)
//     setPagination({ ...pagination, page: 1 })
//     setParams({
//       offset: 0,
//       ordering: option.value === 'asc' ? orderField : `-${orderField}`,
//     })
//   }
//
//   return (
//     <div id="general-section">
//       {user_type !== 'country_user' && (
//         <div className="my-4 flex min-h-[40px] items-center justify-between gap-4">
//           <div className="flex items-center gap-2">
//             <SortBy options={orderOptions} onChange={handleOrderChange} />
//           </div>
//         </div>
//       )}
//       <div className="filters mb-6 flex flex-wrap gap-4">
//         {filters.country.map((countryId: number) => (
//           <Typography
//             key={countryId}
//             className="inline-flex items-center gap-2 rounded bg-gray-100 px-4 font-normal theme-dark:bg-gray-700/20"
//             component="p"
//             variant="h6"
//           >
//             {countriesById.get(countryId)?.name}
//             <IoClose
//               className="cursor-pointer"
//               size={20}
//               onClick={() => {
//                 const values = filters.country || []
//                 const newValue = filter(values, (value) => value !== countryId)
//                 setFilters((filters: any) => {
//                   return {
//                     ...filters,
//                     country: newValue,
//                   }
//                 })
//                 listing.current.setPagination((pagination: any) => ({
//                   ...pagination,
//                   page: 1,
//                 }))
//                 setPagination((pagination) => ({ ...pagination, page: 1 }))
//                 setParams({
//                   country_id: newValue.join(','),
//                   offset: 0,
//                 })
//               }}
//             />
//           </Typography>
//         ))}
//         {filters.year.map((year: string) => (
//           <Typography
//             key={year}
//             className="inline-flex items-center gap-2 bg-gray-50 px-4 font-normal theme-dark:bg-gray-700/20"
//             component="p"
//             variant="h6"
//           >
//             {year}
//             <IoClose
//               className="cursor-pointer"
//               size={20}
//               onClick={() => {
//                 setFilters((filters: any) => {
//                   const values = filters.year || []
//                   return {
//                     ...filters,
//                     year: filter(values, (value) => value !== year),
//                   }
//                 })
//                 listing.current.setPagination((pagination: any) => ({
//                   ...pagination,
//                   page: 1,
//                 }))
//                 setPagination((pagination) => ({ ...pagination, page: 1 }))
//                 setParams({
//                   offset: 0,
//                   year_max: year,
//                   year_min: year,
//                 })
//               }}
//             />
//           </Typography>
//         ))}
//         {(filters.range[0] > minYear || filters.range[1] < maxYear) && (
//           <Typography
//             className="inline-flex items-center gap-2 bg-gray-50 px-4 font-normal theme-dark:bg-gray-700/20"
//             component="p"
//             variant="h6"
//           >
//             {filters.range[0]} - {filters.range[1]}
//             <IoClose
//               className="cursor-pointer"
//               size={20}
//               onClick={() => {
//                 setFilters((filters: any) => {
//                   setRange([minYear, maxYear])
//                   return {
//                     ...filters,
//                     range: [minYear, maxYear],
//                     year: [],
//                   }
//                 })
//                 listing.current.setPagination((pagination: any) => ({
//                   ...pagination,
//                   page: 1,
//                 }))
//                 setPagination((pagination) => ({ ...pagination, page: 1 }))
//                 setParams({
//                   offset: 0,
//                   year_max: maxYear,
//                   year_min: minYear,
//                 })
//               }}
//             />
//           </Typography>
//         )}
//       </div>
//       <Listing
//         className="mb-6"
//         Item={GeneralSectionItem}
//         loaded={loaded}
//         loading={loading}
//         paginationPageSize={pagination.rowsPerPage}
//         ref={listing}
//         rowCount={count}
//         rowData={results}
//         onPaginationChanged={(page) => {
//           setPagination((pagination) => ({ ...pagination, page }))
//           setParams({
//             limit: pagination.rowsPerPage,
//             offset: ((page || 1) - 1) * pagination.rowsPerPage,
//           })
//         }}
//       />
//     </div>
//   )
// }

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
      className={`transition-opacity flex w-full flex-col gap-8 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
    >
      <Typography variant="h3">{group}</Typography>
      <div className="grid w-full grid-flow-row auto-rows-max gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
              className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 pb-2 pr-4 sm:min-w-60"
              underline="none"
              href={
                report.status === 'draft'
                  ? `/country-programme/${country?.iso3}/${report.year}/edit`
                  : `/country-programme/${country?.iso3}/${report.year}`
              }
            >
              <>
                <Typography color="secondary" variant="h4">
                  {report.year}
                </Typography>
                <div className="flex items-baseline gap-1">
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

// @ts-ignore
const CountrySection = React.forwardRef(function CountrySection(
  props: SectionProps,
  ref,
) {
  const { filters, maxYear, minYear, setFilters, setRange, user_type } = props
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
        country_id: filters.country?.join(','),
        limit: PER_PAGE_COUNTRY,
        offset: 0,
        ordering: 'asc',
        show_all_per_group: true,
        status: filters.status,
        year_max: filters.range[1],
        year_min: filters.range[0],
      },
      withStoreCache: false,
    },
    path: 'api/country-programme/reports-by-country/',
  })
  const { count, loaded, results } = getResults(data)

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

  useImperativeHandle(
    ref,
    () => {
      return {
        pagination,
        setPagination,
        setParams,
      }
    },
    [pagination, setPagination, setParams],
  )

  return (
    // @ts-ignore
    <div id="country-section" className="relative" ref={ref}>
      <Loading
        className="bg-mui-box-background/70 !duration-300"
        active={loading}
      />
      {user_type !== 'country_user' && (
        <div className="mt-4 flex min-h-[40px] items-center justify-end gap-4">
          <SortBy options={orderOptions} onChange={handleOrderChange} />
        </div>
      )}
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
                setFilters((filters: any) => {
                  return {
                    ...filters,
                    country: newValue,
                  }
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
                setFilters((filters: any) => {
                  setRange([minYear, maxYear])
                  return {
                    ...filters,
                    range: [minYear, maxYear],
                    year: [],
                  }
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
        className={`transition-opacity mb-6 flex w-full max-w-screen-xl flex-col gap-12 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
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
                      className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 pb-2 pr-4 sm:min-w-60"
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
})

const LogItem = (props: any) => {
  const { group, loaded, loading, reports } = props

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
      className={`transition-opacity flex w-full flex-col gap-8 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
    >
      <Typography variant="h3">{group}</Typography>
      <div className="grid w-full grid-flow-row auto-rows-max gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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

          return (
            <div
              key={index}
              className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 pb-2 pr-4 sm:min-w-60"
            >
              <Typography color="secondary" variant="h4">
                {report.year}
              </Typography>
              <div className="flex items-baseline gap-1">
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
            </div>
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
//eslint-disable-next-line
const LogSection = React.forwardRef(function LogSection(
  props: SectionProps,
  ref,
) {
  const { filters, maxYear, minYear, setFilters, setRange } = props
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
        country_id: filters.country?.join(','),
        limit: PER_PAGE_COUNTRY,
        offset: 0,
        ordering: 'asc',
        show_all_per_group: true,
        status: filters.status,
        year_max: filters.range[1],
        year_min: filters.range[0],
      },
      withStoreCache: false,
    },
    path: 'api/country-programme/reports-by-year/',
  })
  const { count, loaded, results } = getResults(data)

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

  useImperativeHandle(
    ref,
    () => {
      return {
        pagination,
        setPagination,
        setParams,
      }
    },
    [pagination, setPagination, setParams],
  )

  return (
    // @ts-ignore
    <div id="country-section" className="relative" ref={ref}>
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
                setFilters((filters: any) => {
                  return {
                    ...filters,
                    country: newValue,
                  }
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
                setFilters((filters: any) => {
                  setRange([minYear, maxYear])
                  return {
                    ...filters,
                    range: [minYear, maxYear],
                    year: [],
                  }
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
        className={`transition-opacity mb-6 flex w-full max-w-screen-xl flex-col gap-12 duration-300 ${loading || !loaded ? 'opacity-0' : 'opacity-100'}`}
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
                      className="flex items-baseline justify-between gap-4 text-pretty border-0 border-b border-solid border-blue-600 pb-2 pr-4 sm:min-w-60"
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
})

const StatusFilter = (props: any) => {
  const { filters, setCountryFunctions, setFilters, setLogFunctions } = props
  const { setCountryPagination, setCountryParams } = setCountryFunctions
  const { setLogPagination, setLogParams } = setLogFunctions
  const statusFilterOrder = ['all', 'final', 'draft']

  const setParams = setCountryParams || setLogParams
  const setPagination = setCountryPagination || setLogPagination

  const statusLabels: Record<string, string> = {
    all: 'View All',
    draft: 'Drafts',
    final: 'Final',
  }
  const [status, setStatus] = useState<StatusFilterTypes>(filters.status)

  const changeHandler = (
    _: React.MouseEvent<HTMLElement>,
    newValue: StatusFilterTypes,
  ) => {
    setStatus(newValue)
    setFilters((filters: any) => {
      return {
        ...filters,
        status: newValue,
      }
    })
    setParams?.({
      offset: 0,
      status: newValue,
    })
    setPagination?.((pagination: any) => {
      return {
        ...pagination,
        page: 1,
      }
    })
  }
  return (
    <ToggleButtonGroup
      aria-label="Platform"
      color="primary"
      value={status}
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

const CountrySelect = (props: {
  filters: any
  setCountryFunctions: any
  setFilters: any
  setLogFunctions: any
}) => {
  const { filters, setCountryFunctions, setFilters, setLogFunctions } = props
  const { setCountryPagination, setCountryParams } = setCountryFunctions
  const { setLogPagination, setLogParams } = setLogFunctions
  const setParams = setCountryParams || setLogParams
  const setPagination = setCountryPagination || setLogPagination
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
          setFilters((filters: any) => {
            return { ...filters, country: newValue }
          })
          setParams({
            country_id: newValue.join(','),
            offset: 0,
          })
          setPagination((pagination: any) => {
            return {
              ...pagination,
              page: 1,
            }
          })
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
  range: [number, number]
  setCountryFunctions: any
  setFilters: any
  setLogFunctions: any
  setRange: any
}) => {
  const {
    maxYear,
    minYear,
    range,
    setCountryFunctions,
    setFilters,
    setLogFunctions,
    setRange,
  } = props
  const { setCountryPagination, setCountryParams } = setCountryFunctions
  const { setLogPagination, setLogParams } = setLogFunctions

  const setParams = setCountryParams || setLogParams
  const setPagination = setCountryPagination || setLogPagination

  return (
    <Field
      FieldProps={{ className: 'mb-0 px-4' }}
      label="Date"
      max={maxYear}
      min={minYear}
      value={range}
      widget="range"
      onChange={(value: number[]) => {
        setRange(value)
        debounce(() => {
          setFilters((filters: any) => {
            return { ...filters, range: value }
          })
          setParams?.({
            offset: 0,
            year_max: value[1],
            year_min: value[0],
          })
          setPagination?.((pagination: any) => {
            return {
              ...pagination,
              page: 1,
            }
          })
        })
      }}
    />
  )
}

function CPFilters(props: any) {
  const {
    filters,
    maxYear,
    minYear,
    range,
    setCountryFunctions,
    setFilters,
    setLogFunctions,
    setRange,
  } = props

  return (
    <Box
      id="filters"
      className="sticky top-2 flex h-fit flex-col gap-6 rounded-lg p-8"
    >
      <Typography className="text-3xl font-light">Filters</Typography>
      <StatusFilter
        filters={filters}
        setCountryFunctions={setCountryFunctions}
        setFilters={setFilters}
        setLogFunctions={setLogFunctions}
      />
      <CountrySelect
        filters={filters}
        setCountryFunctions={setCountryFunctions}
        setFilters={setFilters}
        setLogFunctions={setLogFunctions}
      />
      <YearSelect
        maxYear={maxYear}
        minYear={minYear}
        range={range}
        setCountryFunctions={setCountryFunctions}
        setFilters={setFilters}
        setLogFunctions={setLogFunctions}
        setRange={setRange}
      />
    </Box>
  )
}

export default function CPListing() {
  const settings = useStore((state) => state.common.settings.data)
  const { user_type } = useStore((state) => state.user.data)
  const [, setCountryRef] = useState(false)
  const [, setLogRef] = useState(false)
  const countryRef = useRef<any>(null)
  const logRef = useRef<any>(null)

  const [activeTab, setActiveTab] = useState(0)

  const minYear = settings.cp_reports.min_year
  const maxYear = settings.cp_reports.max_year
  const [filters, setFilters] = useState<FiltersType>({
    country: [],
    range: [minYear, maxYear],
    status: 'final',
    year: [],
  })
  const [range, setRange] = useState([filters.range[0], filters.range[1]])

  useEffect(() => {
    if (countryRef.current !== null) {
      setCountryRef(true)
    }
  }, [countryRef.current, activeTab])

  useEffect(() => {
    if (logRef.current !== null) {
      setLogRef(true)
    }
  }, [logRef.current, activeTab])

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
          <div className="flex items-center justify-between border-0 border-b border-solid border-primary">
            <Tabs
              className="scrollable"
              aria-label="view country programme report"
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
          </div>
          {activeTab === 0 && (
            <CountrySection
              filters={filters}
              maxYear={maxYear}
              minYear={minYear}
              ref={countryRef}
              setFilters={setFilters}
              setRange={setRange}
              user_type={user_type}
            />
          )}
          {activeTab === 1 && (
            <LogSection
              filters={filters}
              maxYear={maxYear}
              minYear={minYear}
              ref={logRef}
              setFilters={setFilters}
              setRange={setRange}
              user_type={user_type}
            />
          )}
        </div>
        <CPFilters
          filters={filters}
          maxYear={maxYear}
          minYear={minYear}
          range={range}
          setFilters={setFilters}
          setRange={setRange}
          user_type={user_type}
          setCountryFunctions={{
            setCountryPagination: countryRef.current?.setPagination,
            setCountryParams: countryRef.current?.setParams,
          }}
          setLogFunctions={{
            setLogPagination: logRef.current?.setPagination,
            setLogParams: logRef.current?.setParams,
          }}
        />
      </div>
    </>
  )
}
