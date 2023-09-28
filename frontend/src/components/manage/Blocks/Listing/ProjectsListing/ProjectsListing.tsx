'use client'
import React, { useMemo, useRef, useState } from 'react'

import styled from '@emotion/styled'
import {
  Box,
  Button,
  ButtonProps,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItem,
  IconButton as MuiIconButton,
  Pagination,
  Popover,
  Skeleton,
  Slider,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'
import { AnimatePresence } from 'framer-motion'
import { capitalize, isArray, isNumber, isUndefined, times } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import CollapseInOut from '@ors/components/manage/Transitions/CollapseInOut'
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
  timer = setTimeout(func, 300)
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

function ItemDetail({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={cx(
        'flex gap-2 rounded-sm border border-solid border-mui-default-border/20 px-2 py-1',
        'bg-action-highlight',
      )}
    >
      <Typography
        className="text-xs text-typography-faded theme-dark:text-typography-secondary"
        component="span"
      >
        {label}
      </Typography>
      <Typography className="text-xs text-typography-primary" component="span">
        {value}
      </Typography>
    </div>
  )
}

function Item({ collapsedRows, display, index, item, setCollapsedRows }: any) {
  const isCollapsed = !!collapsedRows[index]
  const funds = parseFloat(item.submission?.funds_allocated)
  const parsedFunds =
    !isNaN(funds) && isNumber(funds) ? funds.toLocaleString() : '-'

  const dateAdded = dayjs(item.submission?.date_received).format('ll')

  return (
    <ListItem
      className={cx(
        'group flex flex-col items-start hover:bg-gray-50 theme-dark:hover:bg-gray-700/20',
        {
          'bg-gray-50 theme-dark:bg-gray-700/20':
            display === 'detailed' || isCollapsed,
          'pt-2': !!index,
        },
      )}
      disablePadding
    >
      {!index && <Divider className="mb-3 w-full" />}
      <div className="grid w-full grid-cols-[2fr_1fr] items-center justify-between gap-x-4 px-4">
        {item.isSkeleton ? (
          <>
            <Skeleton />
            <Skeleton />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MuiIconButton
                className="inline p-0"
                aria-label="expand-collapse-row"
                onClick={() => {}}
                disableRipple
              >
                <StyledIoEllipseOutline
                  className={cx('text-primary', {
                    'fill-primary': display === 'detailed' || isCollapsed,
                    'fill-primary/10': display === 'simple' && !isCollapsed,
                  })}
                  size="1rem"
                />
              </MuiIconButton>
              <Link
                className={cx(
                  'align-middle text-sm text-typography no-underline decoration-primary group-hover:text-primary group-hover:underline',
                  { 'font-semibold': display === 'detailed' },
                )}
                href={`/submissions/${item.id}`}
              >
                {item.title}
              </Link>
            </div>
            <div className="flex items-center justify-end gap-4">
              <Typography className="text-sm" component="span">
                {dateAdded.toLowerCase() !== 'invalid date' ? dateAdded : '-'}
              </Typography>
              {display === 'simple' && (
                <IconButton
                  className={cx('group-hover:block', {
                    'md:hidden': !isCollapsed,
                  })}
                  size="small"
                  onClick={() =>
                    setCollapsedRows(() => ({
                      ...collapsedRows,
                      [index]: !collapsedRows[index],
                    }))
                  }
                  disableRipple
                >
                  {isCollapsed && <IoCaretUp size={8} />}
                  {!isCollapsed && <IoCaretDown size={8} />}
                </IconButton>
              )}
            </div>
          </>
        )}
      </div>
      <AnimatePresence>
        {(display === 'detailed' || isCollapsed) && !item.isSkeleton && (
          <CollapseInOut>
            <div className="mb-2 mt-4 flex flex-wrap gap-4 px-10">
              <ItemDetail label="Status" value={item.status || '-'} />
              <ItemDetail label="Country" value={item.country || '-'} />
              <ItemDetail label="Agency" value={item.agency || '-'} />
              <ItemDetail
                label="Project type"
                value={item.project_type || '-'}
              />
              <ItemDetail
                label="Substance type"
                value={item.substance_type || '-'}
              />
              <ItemDetail label="Sector" value={item.sector || '-'} />
              <ItemDetail label="Subsector" value={item.subsector || '-'} />
              <ItemDetail label="Funds requested" value={parsedFunds || '-'} />
            </div>
          </CollapseInOut>
        )}
      </AnimatePresence>
      <Divider className="mt-3 w-full" />
    </ListItem>
  )
}

export default function ProjectsListing() {
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
  const [pagination, setPagination] = useState({ page: 1, rowsPerPage: 50 })
  const [collapsedRows, setCollapsedRows] = useState<Record<string, any>>({})
  const [filters, setFilters] = useState({ ...initialFilters })
  const [apiSettings, setApiSettings] = useState({
    options: {
      delay: 500,
      params: {
        get_submission: false,
        limit: 50,
        offset: 0,
        ...initialParams,
      },
    },
    path: 'api/projects/',
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

  const openDateRange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDateRangeEl(event.currentTarget)
  }

  const closeDateRange = () => {
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
            <div className="mb-4 block flex-wrap justify-between gap-4 lg:flex">
              <div className="mb-4 flex justify-between gap-4 lg:mb-0">
                <Field
                  name="search"
                  className="min-w-[240px] max-w-[240px] sm:max-w-xs lg:max-w-sm"
                  FieldProps={{ className: 'mb-0' }}
                  placeholder="Search by keyword..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MuiIconButton
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
                          disableRipple
                        >
                          <IoSearchOutline />
                        </MuiIconButton>
                      </InputAdornment>
                    ),
                  }}
                  onKeyDown={(event: any) => {
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
                <div className="display-control flex items-center gap-2 lg:hidden">
                  <Typography
                    className="text-typography-secondary"
                    component="span"
                  >
                    Display
                  </Typography>
                  <IconButton
                    active={display === 'simple'}
                    onClick={() => setDisplay('simple')}
                  >
                    <IoRemove size="1rem" />
                  </IconButton>
                  <IconButton
                    active={display === 'detailed'}
                    onClick={() => setDisplay('detailed')}
                  >
                    <IoReorderTwo size="1rem" />
                  </IconButton>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 lg:justify-normal">
                <div className="display-control hidden items-center gap-2 lg:flex">
                  <Typography
                    className="text-typography-secondary"
                    component="span"
                  >
                    Display
                  </Typography>
                  <IconButton
                    active={display === 'simple'}
                    onClick={() => setDisplay('simple')}
                  >
                    <IoRemove size="1rem" />
                  </IconButton>
                  <IconButton
                    active={display === 'detailed'}
                    onClick={() => setDisplay('detailed')}
                  >
                    <IoReorderTwo size="1rem" />
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
                    aria-describedby={open ? 'date-range' : undefined}
                    onClick={openDateRange}
                  >
                    <IoCalendarClearOutline size="1rem" />
                  </IconButton>
                  <Popover
                    id={open ? 'date-range' : undefined}
                    anchorEl={dateRangeEl}
                    open={open}
                    anchorOrigin={{
                      horizontal: 'center',
                      vertical: 'top',
                    }}
                    slotProps={{
                      paper: {
                        className: 'min-w-[200px] overflow-visible px-5 py-2',
                      },
                    }}
                    transformOrigin={{
                      horizontal: 'center',
                      vertical: 'bottom',
                    }}
                    onClose={closeDateRange}
                  >
                    <Slider
                      className="block"
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
                    className="rounded-sm border border-solid border-mui-default-border bg-action-highlight text-typography-secondary hover:border-typography"
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
                      <IoArrowUp size="1rem" />
                    ) : (
                      <IoArrowDown size="1rem" />
                    )}
                  </IconButton>
                </div>
              </div>
            </div>
            {!!filters.search && (
              <div className="mb-4">
                <Typography className="inline-flex items-center gap-2 rounded-sm border border-solid border-mui-default-border bg-action-highlight px-2 py-1 italic text-typography-secondary">
                  {filters.search}
                  <IoClose
                    className="cursor-pointer rounded-sm"
                    onClick={() => {
                      form.current.search.value = ''
                      handleParamsChange({ offset: 0, search: '' })
                      handleFilterChange({ search: '' })
                    }}
                  />
                </Typography>
              </div>
            )}
            <List className={cx({ 'mb-4': !!pages })} disablePadding>
              <Loading
                className="bg-mui-box-background/70 !duration-0"
                active={loading}
              />
              {!rows.length && (
                <>
                  <Divider className="mb-3 w-full" />
                  <ListItem className="block w-full py-4 text-center">
                    No project started
                  </ListItem>
                  <Divider className="mt-3 w-full" />
                </>
              )}
              {rows.map((item, index) => {
                return (
                  <Item
                    key={item.id}
                    collapsedRows={collapsedRows}
                    display={display}
                    index={index}
                    item={item}
                    setCollapsedRows={setCollapsedRows}
                  />
                )
              })}
            </List>
            {!!pages && (
              <Pagination
                className="inline-block flex-nowrap rounded-sm"
                count={pages}
                disabled={loading}
                page={pagination.page}
                siblingCount={1}
                renderItem={(item) => {
                  const disabled = loading || item.disabled
                  const isEllipsis = [
                    'end-ellipsis',
                    'start-ellipsis',
                  ].includes(item.type)

                  return (
                    <Button
                      className={cx(
                        'flex min-w-fit border-collapse gap-2 rounded-none border-y border-r border-solid border-mui-default-border p-3 text-xs leading-none',
                        {
                          'bg-action-highlight': item.selected,
                          'bg-mui-box-background': !item.selected,
                          'border-l': item.type === 'previous',
                          'cursor-default': isEllipsis,
                          'rounded-sm': ['next', 'previous'].includes(
                            item.type,
                          ),
                          'text-typography-faded': disabled,
                          'text-typography-secondary': !disabled,
                        },
                      )}
                      disabled={disabled}
                      onClick={isEllipsis ? () => {} : item.onClick}
                      disableRipple
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
                onChange={(event, page) => {
                  if (page === pagination.page) return
                  setPagination({ ...pagination, page })
                  handleParamsChange({
                    limit: pagination.rowsPerPage,
                    offset: (page - 1) * pagination.rowsPerPage,
                  })
                }}
              />
            )}
          </Box>
        </Grid>
        <Grid md={4} sm={12} xl={3} item>
          <Box>
            <div className="mb-4 flex items-center justify-between">
              <Typography component="h2" variant="h5">
                Filters
              </Typography>
              <Button
                className="p-0"
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
              options={projectSlice.statuses.data}
              widget="chipToggle"
              onChange={(value: Array<number> | null) => {
                handleFilterChange({ status_id: value })
                handleParamsChange({
                  offset: 0,
                  status_id: (value || initialFilters.status_id).join(','),
                })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Country' }}
              getOptionLabel={(option: any) => option?.name}
              options={commonSlice.countries.data}
              value={filters.country_id}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                handleFilterChange({ country_id: value })
                handleParamsChange({
                  country_id: value.map((item: any) => item.id).join(','),
                  offset: 0,
                })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Sector' }}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.sectors.data}
              value={filters.sector_id}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                handleFilterChange({ sector_id: value })
                handleParamsChange({
                  offset: 0,
                  sector_id: value.map((item: any) => item.id).join(','),
                })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Subsector' }}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.subsectors.data}
              value={filters.subsector_id}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                handleFilterChange({ subsector_id: value })
                handleParamsChange({
                  offset: 0,
                  subsector_id: value.map((item: any) => item.id).join(','),
                })
              }}
              multiple
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
              onChange={(_: any, value: any) => {
                handleFilterChange({ project_type_id: value })
                handleParamsChange({
                  offset: 0,
                  project_type_id: value.map((item: any) => item.id).join(','),
                })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Substance Type' }}
              options={substanceTypes}
              value={filters.substance_type}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                handleFilterChange({ substance_type: value })
                handleParamsChange({
                  offset: 0,
                  substance_type: value.map((item: any) => item.id).join(','),
                })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Agency' }}
              getOptionLabel={(option: any) => option?.name}
              options={commonSlice.agencies.data}
              value={filters.agency_id}
              widget="autocomplete"
              onChange={(_: any, value: any) => {
                handleFilterChange({ agency_id: value })
                handleParamsChange({
                  agency_id: value.map((item: any) => item.id).join(','),
                  offset: 0,
                })
              }}
              multiple
            />
          </Box>
        </Grid>
      </Grid>
    </form>
  )
}
