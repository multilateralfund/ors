/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useMemo, useRef, useState } from 'react'

import {
  Box,
  Button,
  InputAdornment,
  IconButton as MuiIconButton,
  Typography,
} from '@mui/material'
import { SuppressKeyboardEventParams } from 'ag-grid-community'
import dayjs from 'dayjs'
import {
  filter,
  find,
  get,
  includes,
  isArray,
  isEqual,
  isObject,
  map,
  reduce,
} from 'lodash'
import { useSnackbar } from 'notistack'

import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/TableRework'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import IconButton from '@ors/components/ui/IconButton/IconButton'
import Link from '@ors/components/ui/Link/Link'
import { KEY_ENTER } from '@ors/constants'
import api, { getResults } from '@ors/helpers/Api/Api'
import { scrollToElement } from '@ors/helpers/Utils/Utils'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import {
  IoArrowDown,
  IoArrowUp,
  IoCaretDown,
  IoCaretUp,
  IoClose,
  IoSearchOutline,
} from 'react-icons/io5'

const dayOfYear = require('dayjs/plugin/dayOfYear')
dayjs.extend(dayOfYear)

let timer: any

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 300)
}

function suppressUndo(params: SuppressKeyboardEventParams) {
  const event = params.event
  const key = event.key
  const suppress = key === 'z' && (event.ctrlKey || event.metaKey)

  return suppress
}

function useGridOptions() {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)

  function formatValue(value: any) {
    return value?.name || ''
  }

  const gridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          field: 'title',
          headerName: 'Title',
          initialWidth: 300,
          suppressAutoSize: true,
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select status' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: projectSlice.statuses.data,
          },
          field: 'status',
          headerName: 'Status',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select country' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: commonSlice.countries.data,
          },
          field: 'country',
          headerName: 'Country',
          initialWidth: 150,
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select project type' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: projectSlice.types.data,
          },
          field: 'project_type',
          headerName: 'Project type',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select agency' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: commonSlice.agencies.data,
          },
          field: 'agency',
          headerName: 'Agency',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select sector' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: projectSlice.sectors.data,
          },
          field: 'sector',
          headerName: 'Sector',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select subsector' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            getOptions: (params: any) => {
              const sector = get(params, 'data.sector')
              const sectorId = find(projectSlice.sectors.data, {
                name: sector,
              })?.id
              if (!sectorId) return []
              return filter(
                projectSlice.subsectors.data,
                (item) => item.sector_id === sectorId,
              )
            },
          },
          field: 'subsector',
          headerComponentParams: {
            info: true,
            tooltip: 'Select a sector before updating subsector',
          },
          headerName: 'Subsector',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select substance type' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: commonSlice.settings.data?.project_substance_types.map(
              (obj: Array<string>) => ({ id: obj[0], name: obj[1] }),
            ),
          },
          field: 'substance_type',
          headerName: 'Substance type',
        },
        {
          cellEditor: 'agNumberCellEditor',
          dataType: 'number',
          field: 'funds_allocated',
          headerName: 'Funds allocated',
        },
        {
          editable: false,
          field: '',
          headerName: 'Substance',
        },
        {
          field: 'code',
          headerName: 'Code',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select cluster' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: projectSlice.clusters.data,
          },
          field: 'cluster',
          headerName: 'Cluster',
        },
        {
          editable: false,
          field: 'metaproject_code',
          headerName: 'Metaproject',
        },
        {
          editable: false,
          field: 'generated_code',
          headerName: 'Subcode',
        },
        {
          editable: false,
          field: 'metaproject_category',
          headerName: 'Metaproject category',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select project type' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: projectSlice.types.data,
          },
          field: 'legacy_project_type',
          headerName: 'Legacy project type',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select sector' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            options: projectSlice.sectors.data,
          },
          field: 'legacy_sector',
          headerName: 'Legacy sector',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select subsector' },
            formatValue,
            getOptionLabel: (option: any) => {
              return isObject(option) ? get(option, 'name') : option
            },
            getOptions: (params: any) => {
              const sector = get(params, 'data.legacy_sector')
              const sectorId = find(projectSlice.sectors.data, {
                name: sector,
              })?.id
              if (!sectorId) return []
              return filter(
                projectSlice.subsectors.data,
                (item) => item.sector_id === sectorId,
              )
            },
          },
          field: 'legacy_subsector',
          headerName: 'Legacy subsector',
        },
      ],
      defaultColDef: {
        // autoHeight: true,
        editable: true,
        headerClass: 'ag-text-center',
        initialWidth: 100,
        minWidth: 100,
        resizable: true,
        // tooltip: true,
        // wrapText: true,
        suppressKeyboardEvent: (params: any) => {
          return suppressUndo(params)
        },
      },
    }),
    [commonSlice, projectSlice],
  )

  return gridOptions
}

const initialParams = {
  agency_id: null,
  approval_meeting_no: null,
  country_id: null,
  // @ts-ignore
  // date_received_after: dayjs().year(1990).dayOfYear(1).format('YYYY-MM-DD'),
  // @ts-ignore
  // date_received_before: dayjs().dayOfYear(365).format('YYYY-MM-DD'),
  ordering: 'title',
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
  // { field: 'date_received', label: 'Date added' },
  { field: 'title', label: 'Title' },
  { field: 'county', label: 'Country' },
  { field: 'agency', label: 'Agency' },
  { field: 'sector', label: 'Sector' },
  { field: 'subsector', label: 'Subsector' },
  { field: 'project_type', label: 'Project type' },
  { field: 'substance_type', label: 'Substance type' },
]

const INITIAL_PAGE_SIZE = 20

export default function PSListing() {
  const { enqueueSnackbar } = useSnackbar()
  const gridOptions = useGridOptions()
  const form = useRef<any>()
  const grid = useRef<any>()
  const currentYear = useMemo(() => dayjs().year(), [])
  const minDateRange = 1990
  const maxDateRange = currentYear
  const [dateRange, setDateRange] = useState([minDateRange, currentYear])
  const [ordering, setOrdering] = useState({
    direction: 'asc',
    field: 'title',
    label: 'Title',
  })
  const [filters, setFilters] = useState({ ...initialFilters })
  const { data, loading, setParams } = useApi({
    options: {
      delay: 500,
      params: {
        get_submission: true,
        limit: INITIAL_PAGE_SIZE,
        offset: 0,
        ...initialParams,
      },
    },
    path: 'api/projects/',
  })

  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const substanceTypes =
    commonSlice.settings.data?.project_substance_types?.map(
      (obj: Array<string>) => ({ id: obj[0], label: obj[1] }),
    )
  const { count, results } = getResults(data)

  const sectorIds = useMemo(() => {
    return map(filters.sector_id, (item: any) => item.id)
  }, [filters.sector_id])

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    grid.current.paginationGoToPage(1)
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  function autoSizeColumns() {
    grid.current.api.autoSizeColumns(
      reduce(
        gridOptions.columnDefs,
        (acc: Array<string>, column) => {
          if (!includes(['title', 'country'], column.field)) {
            acc.push(column.field)
          }
          return acc
        },
        [],
      ),
    )
  }

  return (
    <form
      ref={form}
      onSubmit={(event: any) => {
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      <div className="filters-wrapper mb-4 flex flex-col  gap-4 md:flex-row">
        <Box className="w-full md:max-w-[50%]">
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
            onChange={(_: any, sector_id: any) => {
              const sectorIds = map(sector_id, (item: any) => item.id)
              const subsector_id = filter(filters.subsector_id, (item: any) => {
                return includes(sectorIds, item.sector_id)
              })
              handleFilterChange({
                sector_id,
                subsector_id,
              })
              handleParamsChange({
                offset: 0,
                sector_id: sectorIds.join(','),
                subsector_id: map(subsector_id, (item: any) => item.id).join(
                  ',',
                ),
              })
            }}
            multiple
          />
          {filters.sector_id?.length > 0 && (
            <Field
              Input={{ label: 'Subsector' }}
              getOptionLabel={(option: any) => option?.name}
              value={filters.subsector_id}
              widget="autocomplete"
              options={filter(projectSlice.subsectors.data, (item) => {
                return includes(sectorIds, item.sector_id)
              })}
              onChange={(_: any, value: any) => {
                handleFilterChange({ subsector_id: value })
                handleParamsChange({
                  offset: 0,
                  subsector_id: value.map((item: any) => item.id).join(','),
                })
              }}
              multiple
            />
          )}
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
        <Box className="w-full md:max-w-[50%]"></Box>
      </div>
      <Box className="table-wrapper">
        <div className="mb-4 block flex-wrap justify-between gap-4 lg:flex">
          <div className="mb-4 flex justify-between gap-4 lg:mb-0">
            <Field
              name="search"
              placeholder="Search by keyword..."
              FieldProps={{
                className:
                  'mb-0 min-w-[240px] max-w-[240px] sm:max-w-xs lg:max-w-sm w-full',
              }}
              InputProps={{
                classes: {
                  input: 'py-[6px]',
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <MuiIconButton
                      aria-label="search"
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
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 lg:justify-normal">
            {/* <Field
              FieldProps={{ className: 'mb-0' }}
              label="Date range"
              max={maxDateRange}
              min={minDateRange}
              value={dateRange}
              widget="range"
              onChange={(event: Event, value: number | number[]) => {
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
            /> */}
            <div className="ordering-control flex items-center gap-2">
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
                        ordering: `${ordering.direction === 'asc' ? '' : '-'}${
                          item.field
                        }`,
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
                  <IoArrowUp size={16} />
                ) : (
                  <IoArrowDown size={16} />
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
        <Table
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          enableCellChangeFlash={true}
          gridRef={grid}
          loading={loading}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          paginationPageSize={INITIAL_PAGE_SIZE}
          rowBuffer={10}
          rowCount={count}
          rowData={results}
          suppressCellFocus={false}
          suppressRowHoverHighlight={false}
          undoRedoCellEditing={true}
          withSeparators={true}
          withSkeleton={true}
          getRowId={(props: any) => {
            return props.data.id
          }}
          onCellValueChanged={async (event) => {
            if (isEqual(event.oldValue, event.newValue)) return
            if (event.source === 'undo') return
            const colDef = event.column.getColDef()
            const colId = event.column.getColId()
            api(`api/projects/${event.data.id}`, {
              data: { [colId]: event.newValue },
              method: 'patch',
            })
              .then((response) => {
                enqueueSnackbar(
                  <>{colDef.headerName} has been updated successfully.</>,
                  { variant: 'success' },
                )
              })
              .catch(async (error) => {
                const errorData = await error.json()
                grid.current.api.undoCellEditing()
                enqueueSnackbar(<>{errorData[colId]}</>, { variant: 'error' })
              })
          }}
          onFirstDataRendered={() => {
            autoSizeColumns()
          }}
          onPaginationChanged={({ page, rowsPerPage }) => {
            scrollToElement({
              element: form.current.querySelector('.table-wrapper'),
            })
            handleParamsChange({
              limit: rowsPerPage,
              offset: page * rowsPerPage,
            })
          }}
          onRowDataUpdated={() => {
            setTimeout(() => {
              autoSizeColumns()
            }, 0)
          }}
        />
        <Typography>
          <Link href="/project-submissions/create" variant="contained" button>
            Add new submission
          </Link>
        </Typography>
      </Box>
    </form>
  )
}
