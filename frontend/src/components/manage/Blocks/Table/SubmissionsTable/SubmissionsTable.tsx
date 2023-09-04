'use client'
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'

// import dynamic from 'next/dynamic'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  Popover,
  Typography,
} from '@mui/material'
import {
  BaseSingleInputFieldProps,
  DateValidationError,
  FieldSection,
  UseDateFieldProps,
} from '@mui/x-date-pickers'
import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker'
import { SortChangedEvent } from 'ag-grid-community'
import cx from 'classnames'
import { Dayjs } from 'dayjs'
import { isNumber, sumBy } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import Link from '@ors/components/ui/Link'
import { KEY_ENTER } from '@ors/constants'
import { getResults } from '@ors/helpers/Api/Api'
import useApi from '@ors/hooks/useApi'
import useStore from '@ors/store'

import useGridOptions from './schema'

import { IoCalendar } from '@react-icons/all-files/io5/IoCalendar'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'
import { IoSettingsSharp } from '@react-icons/all-files/io5/IoSettingsSharp'

// const Table = dynamic(() => import('@ors/components/manage/Form/Table'), {
//   ssr: false,
// })

interface ButtonFieldProps
  extends UseDateFieldProps<Dayjs>,
    BaseSingleInputFieldProps<
      Dayjs | null,
      Dayjs,
      FieldSection,
      DateValidationError
    > {
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

const initialParams = {
  agency_id: null,
  approval_meeting_no: null,
  country_id: null,
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
  sector_id: [],
  status_id: [],
  subsector_id: [],
  substance_type: [],
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Typography className={cx('font-semibold text-primary', className)}>
      {children}
    </Typography>
  )
}

function ButtonField(props: ButtonFieldProps) {
  const {
    id,
    InputProps: { ref } = {},
    disabled,
    inputProps: { 'aria-label': ariaLabel } = {},
    label,
    setOpen,
  } = props

  return (
    <Button
      id={id}
      className="text-typography-primary"
      aria-label={ariaLabel}
      disabled={disabled}
      ref={ref}
      variant="text"
      disableRipple
      onClick={() => setOpen?.((prev) => !prev)}
    >
      <IoCalendar className="ltr:mr-2 rtl:ml-2" />
      {label ?? 'Pick a date'}
    </Button>
  )
}

export default function SubmissionsTable() {
  const grid = useRef<any>()
  const form = useRef<any>()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [filters, setFilters] = useState({ ...initialFilters })
  const [datepickerOpen, setDatepickerOpen] = useState(false)
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
  const [collapsedRows, setCollapsedRows] = useState<Array<number>>([])
  const { data, loaded, loading } = useApi(apiSettings)

  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const substanceTypes = commonSlice.settings.data.project_substance_types.map(
    (obj: Array<string>) => ({ id: obj[0], label: obj[1] }),
  )

  const gridOptions = useGridOptions({
    collapsedRows,
    setCollapsedRows,
    statuses: projectSlice.statuses.data,
  })

  const { count, results } = useMemo(() => {
    const { count, results } = getResults(data)
    return {
      count,
      results: results.map((row, index) => ({ ...row, rowIndex: index })),
    }
  }, [data])

  const updatedResults = useMemo(() => {
    const updatedResults = []

    for (let i = 0; i < results.length; i++) {
      updatedResults.push(results[i])

      // Check if this index is in collapsedRows
      if (collapsedRows.includes(i)) {
        // Insert extra rows just below the collapsed row
        updatedResults.push({ collapsedRow: true, ...results[i] })
      }
    }

    return updatedResults
  }, [results, collapsedRows])

  const columnApi = grid.current?.columnApi
  const columnState = columnApi?.getColumnState?.() || []
  const visibleColumns = sumBy(columnState, (state: any) => {
    return state.hide ? 0 : 1
  })

  const open = Boolean(anchorEl)
  const id = open ? 'table-settings' : undefined

  useEffect(() => {
    if (loaded) {
      setCollapsedRows([])
    }
  }, [loaded])

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleSettingsClose = () => {
    setAnchorEl(null)
  }

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
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    grid.current.api.paginationGoToPage(0)
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  return (
    <form
      className="submission-table"
      ref={form}
      onSubmit={(event: any) => {
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      <Grid spacing={2} container>
        <Grid
          className="mb-4 flex justify-between gap-4"
          md={8}
          sm={12}
          xl={9}
          xs={12}
          item
        >
          <TextWidget
            name="search"
            className="max-w-[240px] sm:max-w-xs lg:max-w-sm"
            placeholder="Search by keyword..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    aria-label="search submission table"
                    edge="start"
                    tabIndex={-1}
                    onClick={() => {
                      handleParamsChange({
                        offset: 0,
                        search: form.current.search.value,
                      })
                    }}
                  >
                    <IoSearchOutline />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onKeyDown={(event) => {
              if (event.key === KEY_ENTER) {
                handleParamsChange({
                  offset: 0,
                  search: form.current.search.value,
                })
              }
            }}
          />
          <DatePicker
            className="w-full max-w-sm"
            closeOnSelect={false}
            format="DD/MM/YYYY"
            label="Date range"
            open={datepickerOpen}
            slotProps={{ field: { setOpen: setDatepickerOpen } as any }}
            autoFocus
            onClose={() => setDatepickerOpen(false)}
            onOpen={() => setDatepickerOpen(true)}
            slots={{
              field: ButtonField,
            }}
          />
        </Grid>
      </Grid>
      <Grid className="flex-col-reverse md:flex-row" spacing={2} container>
        <Grid md={8} sm={12} xl={9} item>
          <Table
            className="mb-4"
            collapsedRows={collapsedRows}
            columnDefs={gridOptions.columnDefs}
            gridRef={grid}
            loading={loading}
            rowCount={count}
            rowData={updatedResults}
            fullWidthCellRenderer={(props: any) => {
              const funds = parseFloat(props.data.submission.funds_allocated)

              return (
                <Grid spacing={4} container>
                  <Grid item>
                    <Label>Subsector</Label>
                    <Typography>{props.data.subsector || '-'}</Typography>
                  </Grid>
                  <Grid item>
                    <Label>HFC/HCFC</Label>
                    <Typography>{props.data.substance_type || '-'}</Typography>
                  </Grid>
                  <Grid item>
                    <Label>Funds requested</Label>
                    <Typography>
                      {!isNaN(funds) && isNumber(funds)
                        ? funds.toLocaleString()
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Label>Approval meeting</Label>
                    <Typography>
                      {props.data.approval_meeting_no || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              )
            }}
            getRowHeight={(props: any) => {
              if (props.data.collapsedRow) {
                return 100
              }
            }}
            isFullWidthRow={(params: any) => {
              return !!params.rowNode.data.collapsedRow
            }}
            onPaginationChanged={({ page, rowsPerPage }) => {
              handleParamsChange({
                limit: rowsPerPage,
                offset: page * rowsPerPage,
              })
            }}
            onSortChanged={(event: SortChangedEvent<any>) => {
              handleParamsChange({
                offset: 0,
                ordering: event.columnApi
                  .getColumnState()
                  .filter((state) => state.sort !== null)
                  .map(
                    (state) =>
                      `${state.sort === 'desc' ? '-' : ''}${state.colId}`,
                  )
                  .join(','),
              })
            }}
            withSkeleton
          />
          <Typography>
            <Link href="/submissions/create" variant="contained" button>
              Add new submission
            </Link>
          </Typography>
        </Grid>
        <Grid md={4} sm={12} xl={3} item>
          <Box>
            <div className="mb-4 flex items-center justify-between">
              <Typography component="h2" variant="h4">
                Filters
                <IconButton
                  aria-describedby={id}
                  disableRipple
                  onClick={handleSettingsClick}
                >
                  <IoSettingsSharp size={20} />
                </IconButton>
                <Popover
                  id={id}
                  anchorEl={anchorEl}
                  open={open}
                  anchorOrigin={{
                    horizontal: 'left',
                    vertical: 'bottom',
                  }}
                  onClose={handleSettingsClose}
                  transformOrigin={{
                    horizontal: 'left',
                    vertical: 'top',
                  }}
                >
                  <div className="p-4">
                    <FormGroup aria-label="position">
                      {(columnApi?.getAllColumns?.() || []).map(
                        (column: any) => {
                          return (
                            <FormControlLabel
                              key={column.colId}
                              label={column.colDef.headerName}
                              labelPlacement="end"
                              control={
                                <Checkbox
                                  checked={column.visible}
                                  disableRipple
                                  disabled={
                                    column.visible && visibleColumns <= 1
                                  }
                                  onChange={(event: any) => {
                                    columnApi.applyColumnState({
                                      state: columnState.map((state: any) => {
                                        return {
                                          ...state,
                                          hide:
                                            state.colId === column.colId
                                              ? !event.target.checked
                                              : state.hide,
                                        }
                                      }),
                                    })
                                    forceUpdate()
                                  }}
                                />
                              }
                            />
                          )
                        },
                      )}
                    </FormGroup>
                  </div>
                </Popover>
              </Typography>
              <Button
                onClick={() => {
                  form.current.search.value = ''
                  handleParamsChange({ offset: 0, ...initialParams })
                  handleFilterChange({ ...initialFilters })
                }}
              >
                Clear all
              </Button>
            </div>
            <Field
              options={projectSlice.statuses.data}
              value={filters.status_id}
              widget="chipToggle"
              multiple
              onChange={(value: Array<number> | null) => {
                handleFilterChange({ status_id: value })
                handleParamsChange({ offset: 0, status_id: value?.join(',') })
              }}
            />
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
            <Field
              Input={{ label: 'Meeting' }}
              getOptionLabel={(option: any) => option.toString()}
              options={projectSlice.meetings.data}
              value={filters.approval_meeting_no}
              widget="autocomplete"
              multiple
              onChange={(_: any, value: any) => {
                handleFilterChange({ approval_meeting_no: value })
                handleParamsChange({
                  approval_meeting_no: value
                    .map((item: any) => item.id)
                    .join(','),
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
