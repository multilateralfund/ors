'use client'
import React, { useMemo, useRef, useState } from 'react'

import styled from '@emotion/styled'
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Pagination,
  Popover,
  Skeleton,
  Slider,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'
import { capitalize, isArray, isNumber, times } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import Loading from '@ors/components/theme/Loading/Loading'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import { KEY_ENTER } from '@ors/constants'
import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'
import useStore from '@ors/store'

import { IoArrowBack } from '@react-icons/all-files/io5/IoArrowBack'
import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown'
import { IoArrowForward } from '@react-icons/all-files/io5/IoArrowForward'
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp'
import { IoCalendarClearOutline } from '@react-icons/all-files/io5/IoCalendarClearOutline'
import { IoCaretDown } from '@react-icons/all-files/io5/IoCaretDown'
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoEllipseOutline } from '@react-icons/all-files/io5/IoEllipseOutline'
import { IoRemove } from '@react-icons/all-files/io5/IoRemove'
import { IoReorderTwo } from '@react-icons/all-files/io5/IoReorderTwo'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'

const dayOfYear = require('dayjs/plugin/dayOfYear')
dayjs.extend(dayOfYear)

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 300, event)
}

const StyledIoEllipseOutline = styled(IoEllipseOutline)(() => ({
  circle: {
    fill: 'inherit',
  },
}))

const initialParams = {
  agency_id: null,
  approval_meeting_no: null,
  country_id: null,
  // @ts-ignore
  date_received_after: dayjs().year(1990).dayOfYear(1).format('YYYY-MM-DD'),
  // @ts-ignore
  date_received_before: dayjs().dayOfYear(365).format('YYYY-MM-DD'),
  ordering: 'date_received',
  project_type_id: null,
  search: '',
  sector_id: null,
  status_id: null,
  subsector_id: null,
  substance_type: null,
}

const initialFilters = {
  agency_id: [],
  approval_meeting_no: [],
  country_id: [],
  project_type_id: [],
  search: '',
  sector_id: [],
  status_id: [],
  subsector_id: [],
  substance_type: [],
}

const orderings = [
  { field: 'date_received', label: 'Date added' },
  { field: 'title', label: 'Title' },
  { field: 'county', label: 'Country' },
  { field: 'agency', label: 'Agency' },
  { field: 'sector', label: 'Sector' },
  { field: 'subsector', label: 'Subsector' },
  { field: 'project_type', label: 'Project type' },
  { field: 'substance_type', label: 'Substance type' },
]

export default function SubmissionsListing() {
  const form = useRef<any>()
  const currentYear = useMemo(() => dayjs().year(), [])
  const minDateRange = 1990
  const maxDateRange = currentYear
  const [dateRangeEl, setDateRangeEl] =
    React.useState<HTMLButtonElement | null>(null)
  const [dateRange, setDateRange] = useState([minDateRange, currentYear])
  const [display, setDisplay] = useState('simple')
  const [ordering, setOrdering] = useState({
    direction: 'asc',
    field: 'date_received',
    label: 'Date added',
  })
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 10 })
  const [collapsedRows, setCollapsedRows] = useState<Record<string, any>>({})
  const [filters, setFilters] = useState({ ...initialFilters })
  const [apiSettings, setApiSettings] = useState({
    options: {
      delay: 500,
      params: {
        get_submission: true,
        limit: 10,
        offset: 0,
        ...initialParams,
      },
    },
    path: 'api/projects',
  })
  const { data, loading } = useApi(apiSettings)

  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const substanceTypes = commonSlice.settings.data.project_substance_types.map(
    (obj: Array<string>) => ({ id: obj[0], label: obj[1] }),
  )
  const { count, loaded, results } = getResults(data)

  const rows = useMemo(() => {
    if (!loaded) {
      return times(pagination.rowsPerPage, (num) => {
        return {
          id: num + 1,
          isSkeleton: true,
        }
      })
    }
    return results
  }, [results, loaded, pagination.rowsPerPage])

  const pages = Math.ceil(count / pagination.rowsPerPage)

  function handleParamsChange(newParams: { [key: string]: any }) {
    setApiSettings((prevApiSettings) => ({
      ...prevApiSettings,
      options: {
        ...prevApiSettings.options,
        params: {
          ...prevApiSettings.options.params,
          ...newParams,
        },
      },
    }))
    setCollapsedRows({})
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setPagination({ ...pagination, page: 1 })
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDateRangeEl(event.currentTarget)
  }

  const handleClose = () => {
    setDateRangeEl(null)
  }

  const open = Boolean(dateRangeEl)

  return (
    <form
      className="submission-table"
      ref={form}
      onSubmit={(event: any) => {
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      <Grid className="flex-col-reverse md:flex-row" spacing={2} container>
        <Grid md={8} sm={12} xl={9} item>
          <Box>
            <div className="mb-4 flex flex-wrap justify-between gap-4">
              <TextWidget
                name="search"
                className="min-w-[240px] max-w-[240px] sm:max-w-xs lg:max-w-sm"
                placeholder="Search by keyword..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        aria-label="search submission table"
                        edge="start"
                        tabIndex={-1}
                        onClick={() => {
                          const search = form.current.search.value
                          handleParamsChange({
                            offset: 0,
                            search,
                          })
                          handleFilterChange({ search })
                        }}
                      >
                        <IoSearchOutline />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyDown={(event) => {
                  const search = form.current.search.value
                  if (event.key === KEY_ENTER) {
                    handleParamsChange({
                      offset: 0,
                      search,
                    })
                    handleFilterChange({ search })
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="display-control flex items-center gap-2">
                  <Typography
                    className="text-typography-secondary"
                    component="span"
                  >
                    Display
                  </Typography>
                  <IconButton
                    className={cx('rounded-sm', {
                      'bg-gray-100 text-[#999]': display !== 'simple',
                      'bg-gray-200 text-gray-700': display === 'simple',
                    })}
                    size="small"
                    disableRipple
                    onClick={() => setDisplay('simple')}
                  >
                    <IoRemove />
                  </IconButton>
                  <IconButton
                    className={cx('rounded-sm', {
                      'bg-gray-100 text-[#999]': display !== 'detailed',
                      'bg-gray-200 text-gray-700': display === 'detailed',
                    })}
                    size="small"
                    disableRipple
                    onClick={() => setDisplay('detailed')}
                  >
                    <IoReorderTwo />
                  </IconButton>
                </div>
                <div className="datarange-control flex items-center gap-2">
                  <Typography
                    className="text-typography-secondary"
                    component="span"
                  >
                    Data range
                  </Typography>

                  <IconButton
                    className="rounded-sm bg-gray-200 text-gray-700"
                    aria-describedby={open ? 'date-range' : undefined}
                    size="small"
                    disableRipple
                    onClick={handleClick}
                  >
                    <IoCalendarClearOutline />
                  </IconButton>
                  <Popover
                    id={open ? 'date-range' : undefined}
                    anchorEl={dateRangeEl}
                    open={open}
                    anchorOrigin={{
                      horizontal: 'center',
                      vertical: 'top',
                    }}
                    onClose={handleClose}
                    slotProps={{
                      paper: {
                        className:
                          'min-w-[200px] bg-transparent border-none shadow-none overflow-visible',
                      },
                    }}
                    transformOrigin={{
                      horizontal: 'center',
                      vertical: 'bottom',
                    }}
                  >
                    <Slider
                      getAriaLabel={() => 'Date range'}
                      max={maxDateRange}
                      min={minDateRange}
                      value={dateRange}
                      valueLabelDisplay="auto"
                      onChange={(event, value) => {
                        if (isArray(value) && value[1] - value[0] >= 1) {
                          setDateRange(value)
                          debounce(() => {
                            handleParamsChange({
                              date_received_after: dayjs()
                                .year(value[0])
                                // @ts-ignore
                                .dayOfYear(1)
                                .format('YYYY-MM-DD'),
                              date_received_before: dayjs()
                                .year(value[1])
                                // @ts-ignore
                                .dayOfYear(365)
                                .format('YYYY-MM-DD'),
                            })
                          })
                        }
                      }}
                    />
                  </Popover>
                </div>
                <div className="datarange-control flex items-center gap-2">
                  <Typography
                    className="text-typography-secondary"
                    component="span"
                  >
                    Ordering
                  </Typography>
                  <Dropdown
                    className="rounded-sm bg-gray-200 text-gray-700"
                    label={(props) => {
                      return (
                        <Typography className="flex items-center gap-2 leading-none">
                          {ordering.label}
                          {props.open ? <IoCaretUp /> : <IoCaretDown />}
                        </Typography>
                      )
                    }}
                  >
                    {orderings.map((item) => (
                      <Dropdown.Item
                        key={item.field}
                        onClick={() => {
                          setOrdering({
                            ...ordering,
                            field: item.field,
                            label: item.label,
                          })
                          handleParamsChange({
                            ordering: `${
                              ordering.direction === 'asc' ? '' : '-'
                            }${item.field}`,
                          })
                        }}
                      >
                        {item.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown>
                  <IconButton
                    className={cx('rounded-sm bg-gray-200 text-gray-700')}
                    size="small"
                    disableRipple
                    onClick={() => {
                      const direction =
                        ordering.direction === 'asc' ? 'desc' : 'asc'
                      setOrdering({
                        ...ordering,
                        direction,
                      })
                      handleParamsChange({
                        ordering: `${direction === 'asc' ? '' : '-'}${
                          ordering.field
                        }`,
                      })
                    }}
                  >
                    {ordering.direction === 'asc' ? (
                      <IoArrowUp />
                    ) : (
                      <IoArrowDown />
                    )}
                  </IconButton>
                </div>
              </div>
            </div>
            {!!filters.search && (
              <div className="mb-4">
                <Typography className="inline-flex items-center gap-2  rounded-sm bg-gray-100 px-2 py-1 italic">
                  {filters.search}
                  <IoClose
                    className="cursor-pointer rounded-sm bg-gray-50"
                    onClick={() => {
                      form.current.search.value = ''
                      handleParamsChange({ offset: 0, search: '' })
                      handleFilterChange({ search: '' })
                    }}
                  />
                </Typography>
              </div>
            )}
            <List className="mb-6" disablePadding>
              <Loading
                className="bg-action-disabledBackground/5"
                active={loading}
              />
              {!rows.length && (
                <>
                  <Divider className="mb-3 w-full border-gray-200" />
                  <ListItem className="block w-full py-4 text-center">
                    No rows to show
                  </ListItem>
                  <Divider className="mt-3 w-full" />
                </>
              )}
              {rows.map((item, index) => {
                const odd = index % 2 !== 0
                const isCollapsed = !!collapsedRows[index]
                const funds = parseFloat(item.submission?.funds_allocated)
                const parsedFunds =
                  !isNaN(funds) && isNumber(funds)
                    ? funds.toLocaleString()
                    : '-'

                const dateAdded = dayjs(item.submission?.date_received).format(
                  'll',
                )

                return (
                  <ListItem
                    key={item.id}
                    className={cx('group flex flex-col items-start', {
                      'bg-gray-50': display === 'detailed' && odd,
                      'hover:bg-gray-50': display === 'simple',
                      'pt-2': !!index,
                    })}
                    disablePadding
                  >
                    {!index && (
                      <Divider className="mb-3 w-full border-gray-200" />
                    )}
                    <div className="grid w-full grid-cols-[2fr_1fr] items-center justify-between gap-x-4 px-4">
                      {item.isSkeleton ? (
                        <>
                          <Skeleton />
                          <Skeleton />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <IconButton
                              className="inline p-0"
                              aria-label="expand-collapse-row"
                              disableRipple
                              onClick={() => {}}
                            >
                              <StyledIoEllipseOutline
                                className={cx('text-primary', {
                                  'fill-primary':
                                    display === 'detailed' || isCollapsed,
                                  'fill-primary/10':
                                    display === 'simple' && !isCollapsed,
                                })}
                                size="1rem"
                              />
                            </IconButton>
                            <Link
                              className={cx(
                                'align-middle text-typography no-underline decoration-primary group-hover:text-primary group-hover:underline',
                              )}
                              href={`/submissions/${item.id}`}
                            >
                              {item.title}
                            </Link>
                          </div>
                          <div className="flex items-center justify-end gap-4">
                            <Typography component="span">
                              {dateAdded.toLowerCase() !== 'invalid date'
                                ? dateAdded
                                : '-'}
                            </Typography>
                            {display === 'simple' && (
                              <IconButton
                                className={cx(
                                  'rounded-sm bg-white text-gray-900 group-hover:block',
                                  { hidden: !collapsedRows[index] },
                                )}
                                size="small"
                                disableRipple
                                onClick={() =>
                                  setCollapsedRows((prevCollapsedRows) => ({
                                    ...prevCollapsedRows,
                                    [index]: !prevCollapsedRows[index],
                                  }))
                                }
                              >
                                {isCollapsed && <IoCaretUp size={14} />}
                                {!isCollapsed && <IoCaretDown size={14} />}
                              </IconButton>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {(display === 'detailed' || isCollapsed) &&
                      !item.isSkeleton && (
                        <div className="mt-2 flex flex-wrap gap-4 px-10">
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Status
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.status || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Country
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.country || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Agency
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.agency || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Project type
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.project_type || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Substance type
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.substance_type || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Sector
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.sector || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Subsector
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {item.subsector || '-'}
                            </Typography>
                          </div>
                          <div
                            className={cx(
                              'flex gap-2 rounded-sm px-2 py-1 group-hover:bg-white',
                              {
                                'bg-gray-50': display === 'simple' || !odd,
                                'bg-white': display === 'detailed' && odd,
                              },
                            )}
                          >
                            <Typography
                              className="text-gray-500"
                              component="span"
                            >
                              Funds requested
                            </Typography>
                            <Typography
                              className="text-gray-900"
                              component="span"
                            >
                              {parsedFunds}
                            </Typography>
                          </div>
                        </div>
                      )}
                    <Divider className="mt-3 w-full" />
                  </ListItem>
                )
              })}
            </List>
            {!!pages && (
              <Pagination
                className="mb-8 inline-block flex-nowrap rounded-sm"
                count={pages}
                disabled={loading}
                page={pagination.page}
                siblingCount={1}
                onChange={(event, page) => {
                  if (page === pagination.page) return
                  setPagination({ ...pagination, page })
                  handleParamsChange({
                    limit: pagination.rowsPerPage,
                    offset: (page - 1) * pagination.rowsPerPage,
                  })
                }}
                renderItem={(item) => {
                  const disabled = loading || item.disabled
                  const isEllipsis = [
                    'end-ellipsis',
                    'start-ellipsis',
                  ].includes(item.type)

                  return (
                    <Button
                      className={cx(
                        'flex min-w-fit border-collapse gap-2 rounded-none border-y border-r border-solid border-mui-box-border p-3 text-xs leading-none',
                        {
                          'bg-gray-100': item.selected,
                          'border-l': item.type === 'previous',
                          'cursor-default': isEllipsis,
                          'rounded-sm': ['next', 'previous'].includes(
                            item.type,
                          ),
                          'text-gray-500': disabled,
                          'text-gray-900': !disabled,
                        },
                      )}
                      disabled={disabled}
                      disableRipple
                      onClick={isEllipsis ? () => {} : item.onClick}
                    >
                      {item.type === 'previous' && <IoArrowBack />}
                      {['next', 'previous'].includes(item.type) && (
                        <span className="hidden md:inline">
                          {capitalize(item.type)}
                        </span>
                      )}
                      {item.type === 'page' && item.page}
                      {isEllipsis && '...'}
                      {item.type === 'next' && <IoArrowForward />}
                    </Button>
                  )
                }}
              />
            )}
            <Typography>
              <Link href="/submissions/create" variant="contained" button>
                Add new submission
              </Link>
            </Typography>
          </Box>
        </Grid>
        <Grid md={4} sm={12} xl={3} item>
          <Box>
            <div className="mb-4 flex items-center justify-between">
              <Typography component="h2" variant="h5">
                Filters
              </Typography>
              <Button
                onClick={() => {
                  form.current.search.value = ''
                  handleParamsChange({ offset: 0, ...initialParams })
                  handleFilterChange({ ...initialFilters })
                  setOrdering({
                    direction: 'asc',
                    field: 'date_received',
                    label: 'Date added',
                  })
                  setDateRange([minDateRange, maxDateRange])
                }}
              >
                Clear all
              </Button>
            </div>
            <Field
              Input={{ label: 'Country' }}
              getOptionLabel={(option: any) => option?.name}
              options={commonSlice.countries.data}
              value={filters.country_id}
              widget="autocomplete"
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ country_id: value })
                handleParamsChange({
                  country_id: value.map((item: any) => item.id).join(','),
                  offset: 0,
                })
              }}
            />
            <Field
              Input={{ label: 'Sector' }}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.sectors.data}
              value={filters.sector_id}
              widget="autocomplete"
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ sector_id: value })
                handleParamsChange({
                  offset: 0,
                  sector_id: value.map((item: any) => item.id).join(','),
                })
              }}
            />
            <Field
              Input={{ label: 'Subsector' }}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.subsectors.data}
              value={filters.subsector_id}
              widget="autocomplete"
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ subsector_id: value })
                handleParamsChange({
                  offset: 0,
                  subsector_id: value.map((item: any) => item.id).join(','),
                })
              }}
            />
            <Field
              Input={{ label: 'Type' }}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.types.data}
              value={filters.project_type_id}
              widget="autocomplete"
              isOptionEqualToValue={(option: any, value: any) =>
                option.id === value
              }
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ project_type_id: value })
                handleParamsChange({
                  offset: 0,
                  project_type_id: value.map((item: any) => item.id).join(','),
                })
              }}
            />
            <Field
              Input={{ label: 'Substance Type' }}
              options={substanceTypes}
              value={filters.substance_type}
              widget="autocomplete"
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ substance_type: value })
                handleParamsChange({
                  offset: 0,
                  substance_type: value.map((item: any) => item.id).join(','),
                })
              }}
            />
            <Field
              Input={{ label: 'Agency' }}
              getOptionLabel={(option: any) => option?.name}
              options={commonSlice.agencies.data}
              value={filters.agency_id}
              widget="autocomplete"
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ agency_id: value })
                handleParamsChange({
                  agency_id: value.map((item: any) => item.id).join(','),
                  offset: 0,
                })
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}
