'use client'
import { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  ButtonProps,
  Divider,
  Grid,
  // InputAdornment,
  ListItem,
  // IconButton as MuiIconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { isUndefined, range, slice } from 'lodash'
import { useRouter } from 'next/navigation'

import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import api, { getResults } from '@ors/helpers/Api/Api'
import useStore from '@ors/store'

import Field from '../../Form/Field'
import Listing from '../../Form/Listing'

import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
// import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'

interface SectionPanelProps {
  curentSection: number
  section: number
}

function IconButton({
  active,
  className,
  ...rest
}: ButtonProps & { active?: boolean }) {
  const isActive = isUndefined(active) || !!active

  return (
    <Button
      className={cx(
        'min-w-fit rounded-sm border border-solid border-mui-default-border p-[6px] hover:border-typography',
        {
          'bg-action-highlight text-typography-secondary': isActive,
          'bg-action-highlight/10 text-typography-faded theme-dark:bg-action-highlight/20':
            !isActive,
        },
        className,
      )}
      {...rest}
    />
  )
}

function Item({ index, item }: any) {
  const router = useRouter()
  return (
    <ListItem
      className={cx(
        'group flex cursor-pointer flex-col items-start hover:bg-gray-50 theme-dark:hover:bg-gray-700/20',
        {
          'pt-2': !!index,
        },
      )}
      onClick={() => {
        router.push(`/country-programme/${item.id}`)
      }}
      disablePadding
    >
      {!index && <Divider className="mb-3 w-full" />}
      <div className="grid w-full grid-cols-[2fr_1fr] items-center justify-between gap-x-4 px-4">
        <Typography className="group-hover:text-primary group-hover:underline">
          {item.name}
        </Typography>
        <Typography className="text-right group-hover:text-primary">
          {item.year}
        </Typography>
      </div>
      <Divider className="mt-3 w-full" />
    </ListItem>
  )
}

function CountrySection() {
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 4 })
  const [ordering, setOrdering] = useState('asc')
  const [data, setData] = useState<Array<any>>([])
  const [activeCountry, setActiveCountry] = useState<any>(null)
  const [activeCountryPagination, setActiveCountryPagination] = useState({
    page: 1,
    rowsPerPage: 20,
  })
  const [activeCountryData, setActiveCountryData] = useState<any>()

  const countriesOptions = useStore(
    (state) => getResults(state.common.countries.data).results,
  )

  const countries: any = useMemo(() => {
    return slice(
      getResults(countriesOptions).results,
      (pagination.page - 1) * pagination.rowsPerPage,
      pagination.page * pagination.rowsPerPage,
    )
  }, [pagination, countriesOptions])

  const pages = useMemo(
    () => Math.ceil(countriesOptions.length / pagination.rowsPerPage),
    [countriesOptions, pagination],
  )

  useEffect(() => {
    async function fetchData() {
      const data = []
      for (const country of countries) {
        data.push({
          ...getResults(
            await api(
              'api/country-programme/reports/',
              {
                params: { country_id: country.id, limit: 6 },
                withStoreCache: true,
              },
              false,
            ),
          ),
          id: country.id,
        })
      }
      setData(data)
    }
    fetchData()
  }, [countries])

  useEffect(() => {
    async function fetchData() {
      setActiveCountryData(
        getResults(
          await api(
            'api/country-programme/reports/',
            {
              params: {
                country_id: activeCountry.id,
                limit: activeCountryPagination.rowsPerPage,
                offset:
                  (activeCountryPagination.page - 1) *
                  activeCountryPagination.rowsPerPage,
              },
              withStoreCache: true,
            },
            false,
          ),
        ),
      )
    }
    if (activeCountry?.id) {
      fetchData()
    }
  }, [activeCountry, activeCountryPagination])

  return (
    <>
      <div className="mb-4 flex justify-between gap-4">
        <Field
          FieldProps={{ className: 'mb-0 w-full max-w-xs' }}
          Input={{ placeholder: 'Select country' }}
          getOptionLabel={(option: any) => option.name}
          options={countriesOptions}
          value={activeCountry}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            if (!!value) {
              setActiveCountry(value)
            } else {
              setActiveCountry(null)
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
      {!activeCountry && (
        <>
          <Grid className="mb-6" spacing={4} container>
            {countries.map((country: any, index: number) => (
              <Grid key={country.iso3} lg={6} xs={12} item>
                <Typography
                  className="mb-4 inline-flex cursor-pointer items-center gap-2 px-4 font-normal"
                  component="p"
                  variant="h6"
                  onClick={() => {
                    setActiveCountry(country)
                  }}
                >
                  {country.name}
                  <IoArrowForward size={20} />
                </Typography>
                <Listing
                  className="mb-3"
                  Item={Item}
                  enablePagination={false}
                  loaded={data[index]?.loaded}
                  loading={!data[index] || data[index].id !== country.id}
                  rowCount={data[index]?.count || 0}
                  rowData={data[index]?.results || []}
                />
                {!!data[index]?.count && data[index].count > 6 && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setActiveCountry(country)
                      setActiveCountryPagination((pagination) => ({
                        ...pagination,
                        page: 1,
                      }))
                    }}
                    disableRipple
                  >
                    View more...
                  </Button>
                )}
              </Grid>
            ))}
          </Grid>
          <Pagination
            count={pages}
            onPaginationChanged={(page) => {
              setPagination({ ...pagination, page: page || 1 })
            }}
          />
        </>
      )}
      {!!activeCountry && (
        <>
          <Typography
            className="mb-4 inline-flex items-center gap-2 bg-gray-50 px-4 font-normal theme-dark:bg-gray-700/20"
            component="p"
            variant="h6"
          >
            {activeCountry.name}
            <IoClose
              className="cursor-pointer"
              size={20}
              onClick={() => {
                setActiveCountry(null)
                setActiveCountryPagination((pagination) => ({
                  ...pagination,
                  page: 1,
                }))
              }}
            />
          </Typography>
          <Listing
            Item={Item}
            loaded={activeCountryData?.loaded}
            // loading={!data[index] || data[index].id !== country.id}
            loading={false}
            rowCount={activeCountryData?.count}
            rowData={activeCountryData?.results}
            onPaginationChanged={(page) => {
              setActiveCountryPagination((pagination) => ({
                ...pagination,
                page: page || 1,
              }))
            }}
          />
        </>
      )}
    </>
  )
}

function YearSection() {
  const [yearsOptions] = useState(
    range(new Date().getFullYear(), 1980).map((year) => ({
      id: year,
      label: year,
    })),
  )
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 4 })
  const [ordering, setOrdering] = useState('asc')
  const [data, setData] = useState<Array<any>>([])
  const [activeYear, setActiveYear] = useState<any>(null)
  const [activeYearPagination, setActiveYearPagination] = useState({
    page: 1,
    rowsPerPage: 20,
  })
  const [activeYearData, setActiveYearData] = useState<any>()

  const years: any = useMemo(() => {
    return slice(
      getResults(yearsOptions).results,
      (pagination.page - 1) * pagination.rowsPerPage,
      pagination.page * pagination.rowsPerPage,
    )
  }, [pagination, yearsOptions])

  const pages = useMemo(
    () => Math.ceil(yearsOptions.length / pagination.rowsPerPage),
    [yearsOptions, pagination],
  )

  useEffect(() => {
    async function fetchData() {
      const data = []
      for (const year of years) {
        data.push({
          ...getResults(
            await api(
              'api/country-programme/reports/',
              {
                params: { limit: 6, year: year.id },
                withStoreCache: true,
              },
              false,
            ),
          ),
          year_id: year.id,
        })
      }
      setData(data)
    }
    fetchData()
  }, [years])

  useEffect(() => {
    async function fetchData() {
      setActiveYearData(
        getResults(
          await api(
            'api/country-programme/reports/',
            {
              params: {
                limit: activeYearPagination.rowsPerPage,
                offset:
                  (activeYearPagination.page - 1) *
                  activeYearPagination.rowsPerPage,
                year: activeYear.id,
              },
              withStoreCache: true,
            },
            false,
          ),
        ),
      )
    }
    if (activeYear?.id) {
      fetchData()
    }
  }, [activeYear, activeYearPagination])

  return (
    <>
      <div className="mb-4 flex justify-between gap-4">
        <Field
          FieldProps={{ className: 'mb-0 w-full max-w-xs' }}
          Input={{ placeholder: 'Select year' }}
          options={yearsOptions}
          value={activeYear}
          widget="autocomplete"
          onChange={(_: any, value: any) => {
            if (!!value) {
              setActiveYear(value)
            } else {
              setActiveYear(null)
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
      {!activeYear && (
        <>
          <Grid className="mb-6" spacing={4} container>
            {years.map((year: any, index: number) => (
              <Grid key={year.id} lg={6} xs={12} item>
                <Typography
                  className="mb-4 inline-flex cursor-pointer items-center gap-2 px-4 font-normal"
                  component="p"
                  variant="h6"
                  onClick={() => {
                    setActiveYear(year)
                  }}
                >
                  {year.label}
                  <IoArrowForward size={20} />
                </Typography>
                <Listing
                  className="mb-3"
                  Item={Item}
                  enablePagination={false}
                  loaded={data[index]?.loaded}
                  loading={!data[index] || data[index].year_id !== year.id}
                  rowCount={data[index]?.count || 0}
                  rowData={data[index]?.results || []}
                />
                {!!data[index]?.count && data[index].count > 6 && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setActiveYear(year)
                      setActiveYearPagination((pagination) => ({
                        ...pagination,
                        page: 1,
                      }))
                    }}
                    disableRipple
                  >
                    View more...
                  </Button>
                )}
              </Grid>
            ))}
          </Grid>
          <Pagination
            count={pages}
            onPaginationChanged={(page) => {
              setPagination({ ...pagination, page: page || 1 })
            }}
          />
        </>
      )}
      {!!activeYear && (
        <>
          <Typography
            className="mb-4 inline-flex items-center gap-2 bg-gray-50 px-4 font-normal theme-dark:bg-gray-700/20"
            component="p"
            variant="h6"
          >
            {activeYear.label}
            <IoClose
              className="cursor-pointer"
              size={20}
              onClick={() => {
                setActiveYear(null)
                setActiveYearPagination((pagination) => ({
                  ...pagination,
                  page: 1,
                }))
              }}
            />
          </Typography>
          <Listing
            Item={Item}
            loaded={activeYearData?.loaded}
            // loading={!data[index] || data[index].id !== country.id}
            loading={false}
            rowCount={activeYearData?.count}
            rowData={activeYearData?.results}
            onPaginationChanged={(page) => {
              setActiveYearPagination((pagination) => ({
                ...pagination,
                page: page || 1,
              }))
            }}
          />
        </>
      )}
    </>
  )
}

export const sections = [
  {
    id: 'section-country',
    component: CountrySection,
    label: 'Country',
    panelId: 'section-country-panel',
  },
  {
    id: 'section-year',
    component: YearSection,
    label: 'Year',
    panelId: 'section-year-panel',
  },
]

function SectionPanel(props: SectionPanelProps) {
  const { curentSection, section, ...rest } = props
  const Section: React.FC<any> = sections[section].component

  return (
    <div
      id={sections[section].panelId}
      aria-labelledby={sections[section].id}
      hidden={curentSection !== section}
      role="tabpanel"
      {...rest}
    >
      <Section />
    </div>
  )
}

export default function CPListing() {
  const [activeSection, setActiveSection] = useState(0)

  return (
    <Box>
      <Tabs
        className="mb-4"
        aria-label="country programme listing"
        value={activeSection}
        onChange={(event: React.SyntheticEvent, newSection: number) => {
          setActiveSection(newSection)
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
      {sections.map((section, index) => (
        <SectionPanel
          key={section.id}
          curentSection={activeSection}
          section={index}
        />
      ))}
    </Box>
  )
}
