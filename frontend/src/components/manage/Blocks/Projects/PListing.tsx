/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  InputAdornment,
  IconButton as MuiIconButton,
  Typography,
} from '@mui/material'
import { AiFillFileExcel } from '@react-icons/all-files/ai/AiFillFileExcel'
import { IoArrowDown } from '@react-icons/all-files/io5/IoArrowDown'
import { IoArrowUp } from '@react-icons/all-files/io5/IoArrowUp'
import { IoCaretDown } from '@react-icons/all-files/io5/IoCaretDown'
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp'
import { IoClose } from '@react-icons/all-files/io5/IoClose'
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline'
import { IoSearchOutline } from '@react-icons/all-files/io5/IoSearchOutline'
import {
  filter,
  includes,
  isArray,
  isEqual,
  isPlainObject,
  keys,
  map,
  mapValues,
  omit,
  pick,
  reduce,
} from 'lodash'
import { useSnackbar } from 'notistack'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import IconButton from '@ors/components/ui/IconButton/IconButton'
import Link from '@ors/components/ui/Link/Link'
import { KEY_ENTER } from '@ors/constants'
import api, { formatApiUrl } from '@ors/helpers/Api/Api'
import { debounce } from '@ors/helpers/Utils/Utils'
import useApi from '@ors/hooks/useApi'
import useResults from '@ors/hooks/useResults'
import { useStore } from '@ors/store'

import { usePListingGridOptions as useGridOptions } from './schema'

const INITIAL_PAGE_SIZE = 25

const orderings = [
  { direction: 'asc', field: 'title', label: 'Title' },
  { field: 'country__name', label: 'Country' },
  { field: 'agency__name', label: 'Agency' },
  { field: 'sector__name', label: 'Sector' },
  { field: 'subsector__name', label: 'Subsector' },
  { field: 'project_type__name', label: 'Project type' },
  { field: 'substance_type', label: 'Substance type' },
]

const initialParams = {
  agency_id: [],
  cluster_id: [],
  country_id: [],
  get_submission: false,
  offset: 0,
  ordering: orderings[0],
  project_type_id: [],
  search: '',
  sector_id: [],
  status_id: [],
  subsector_id: [],
  substance_type: [],
}

function parseParams(params: any) {
  return mapValues(params, (o, key) => {
    if (key === 'ordering' && o) {
      return `${o.direction === 'asc' ? '' : '-'}${o.field}`
    }
    if (isArray(o)) {
      return map(o, (item) => (isPlainObject(item) ? item.id : item))
    }
    return o
  })
}

function ProjectsStatistics(props: any) {
  const { statistics }: any = props
  const { data } = statistics

  const chartData = useMemo(
    () => [
      {
        projects_code_count: data?.projects_code_count || 0,
        projects_code_subcode_count: data?.projects_code_subcode_count || 0,
        projects_count: data?.projects_count || 0,
      },
    ],
    [data],
  )

  const COLORS = ['#0075DB', '#00856C', '#D14600']

  return (
    <Box className="flex flex-col items-center">
      <Typography className="text-lg font-semibold">
        Number of projects
      </Typography>
      <ResponsiveContainer className="max-h-[460px] min-h-[300px] max-w-[600px]">
        <BarChart
          data={chartData}
          height={300}
          title="Projects count"
          width={600}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={false} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            name="Total projects"
            dataKey="projects_count"
            fill={COLORS[0]}
            maxBarSize={120}
            stackId="a"
          />
          <Bar
            name="Total projects with code and subcode"
            dataKey="projects_code_subcode_count"
            fill={COLORS[1]}
            maxBarSize={120}
            stackId="b"
          />
          <Bar
            name="Total projects with code, missing subcode"
            dataKey="projects_code_count"
            fill={COLORS[2]}
            maxBarSize={120}
            stackId="b"
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default function PListing() {
  const { enqueueSnackbar } = useSnackbar()
  const [commonSlice, projectSlice] = useStore((state) => [
    state.common,
    state.projects,
  ])
  const gridOptions = useGridOptions()
  const form = useRef<any>()
  const grid = useRef<any>()
  const [lastChange, setLastChange] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [unappliedParams, setUnappliedParams] = useState(false)
  const [params, setParams] = useState<Record<string, any>>({
    ...initialParams,
    limit: INITIAL_PAGE_SIZE,
  })
  const projects = useApi({
    options: {
      params,
    },
    parseParams,
    path: 'api/projects/',
  })
  const statistics = useApi({
    options: {
      params: omit(params, ['ordering', 'limit', 'offset']),
    },
    parseParams,
    path: 'api/projects-statistics/',
  })

  /**
   * Retrieves the count and results from the provided data.
   */
  const { count, results, ...projectsResults } = useResults(projects)

  /**
   * Retrieves the substance types from the commonSlice settings data and maps them to an array of objects with id and label properties.
   */
  const substanceTypes = useMemo(() => {
    return (
      commonSlice.settings.data?.project_substance_types?.map(
        (obj: Array<string>) => ({ id: obj[0], label: obj[1] }),
      ) || []
    )
  }, [commonSlice.settings.data])

  /**
   * Returns an array of sector IDs based on the provided parameters.
   * @returns {Array<number>} The array of sector IDs.
   */
  const sectorIds = useMemo(() => {
    return map(params.sector_id, (item: any) => item.id)
  }, [params.sector_id])

  /**
   * Calculates sector statistics based on the projects count per sector.
   * @returns An object containing the sector names as keys and the corresponding project counts as values.
   */
  const sectorStatistics = useMemo(() => {
    return reduce(
      statistics.data?.projects_count_per_sector || [],
      (acc: any, item: any) => {
        acc[item.sector__name] = item.count
        return acc
      },
      {},
    )
  }, [statistics.data])

  /**
   * Calculates the cluster statistics based on the projects count per cluster data.
   * @returns An object containing the cluster names as keys and the corresponding project counts as values.
   */
  const clusterStatistics = useMemo(() => {
    return reduce(
      statistics.data?.projects_count_per_cluster || [],
      (acc: any, item: any) => {
        acc[item.cluster__name] = item.count
        return acc
      },
      {},
    )
  }, [statistics.data])

  /**
   * Updates the parameters with the provided new parameters.
   * @param newParams - The new parameters to update.
   */
  function updateParams(newParams: any) {
    if (!unappliedParams) {
      setUnappliedParams(true)
    }
    setParams({
      ...params,
      ...newParams,
    })
  }

  /**
   * Applies the given parameters to the current params object and updates the state.
   * If `goToFirstPage` is true, it also resets the pagination to the first page.
   * @param newParams - The new parameters to apply.
   * @param goToFirstPage - Whether to go to the first page of pagination. Default is true.
   */
  function applyParams(
    newParams?: Record<string, any> | undefined,
    goToFirstPage = true,
  ) {
    const currentParams = {
      ...params,
      ...(newParams || {}),
    }
    if (goToFirstPage) {
      debounce(
        () => grid.current.paginationGoToPage(0, false),
        0,
        'PListing:paginaionGoToPage:1',
      )
      currentParams.offset = 0
      updateParams(currentParams)
    }
    if (newParams) {
      updateParams(currentParams)
    }
    setUnappliedParams(false)
    projects.setParams(currentParams)
    statistics.setParams(omit(currentParams, ['limit', 'offset', 'ordering']))
  }

  function autoSizeColumns() {
    if (!grid.current.api) return
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

  useEffect(() => {
    setLoading(projectsResults.loading)
  }, [projectsResults.loading])

  return (
    <form
      ref={form}
      onSubmit={(event: any) => {
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      <div className="filters-wrapper mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[1fr_2fr]">
        <Box className="flex flex-col justify-between md:min-w-[300px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Typography component="h2" variant="h5">
                Filters
              </Typography>
            </div>
            <Field
              disabled={loading}
              multiple={true}
              value={params.status_id}
              widget="chipToggle"
              options={filter(projectSlice.statuses.data, (item) => {
                return item.code !== 'NEWSUB'
              })}
              onChange={(status_id) => {
                updateParams({ status_id })
              }}
            />
            <Field
              Input={{ label: 'Country' }}
              disabled={loading}
              getOptionLabel={(option: any) => option?.name}
              options={commonSlice.countries.data}
              value={params.country_id}
              widget="autocomplete"
              onChange={(_: any, country_id: any) => {
                updateParams({ country_id })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Sector' }}
              disabled={loading}
              getCount={(option: any) => sectorStatistics[option?.name] || 0}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.sectors.data}
              value={params.sector_id}
              widget="autocomplete"
              onChange={(_: any, sector_id: any) => {
                const sectorIds = map(sector_id, (item: any) => item.id)
                const subsector_id = filter(
                  params.subsector_id,
                  (item: any) => {
                    return includes(sectorIds, item.sector_id)
                  },
                )
                updateParams({
                  sector_id,
                  subsector_id,
                })
              }}
              multiple
            />
            {params.sector_id?.length > 0 && (
              <Field
                Input={{ label: 'Subsector' }}
                disabled={loading}
                getOptionLabel={(option: any) => option?.name}
                value={params.subsector_id}
                widget="autocomplete"
                options={filter(projectSlice.subsectors.data, (item) => {
                  return includes(sectorIds, item.sector_id)
                })}
                onChange={(_: any, subsector_id: any) => {
                  updateParams({ subsector_id })
                }}
                multiple
              />
            )}
            <Field
              Input={{ label: 'Cluster' }}
              disabled={loading}
              getCount={(option: any) => clusterStatistics[option?.name] || 0}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.clusters.data}
              value={params.cluster_id}
              widget="autocomplete"
              onChange={(_: any, cluster_id: any) => {
                updateParams({ cluster_id })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Type' }}
              disabled={loading}
              getOptionLabel={(option: any) => option?.name}
              options={projectSlice.types.data}
              value={params.project_type_id}
              widget="autocomplete"
              isOptionEqualToValue={(option: any, value: any) =>
                option.id === value
              }
              onChange={(_: any, project_type_id: any) => {
                updateParams({ project_type_id })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Substance Type' }}
              disabled={loading}
              options={substanceTypes}
              value={params.substance_type}
              widget="autocomplete"
              onChange={(_: any, substance_type: any) => {
                updateParams({ substance_type })
              }}
              multiple
            />
            <Field
              Input={{ label: 'Agency' }}
              disabled={loading}
              getOptionLabel={(option: any) => option?.name}
              options={commonSlice.agencies.data}
              value={params.agency_id}
              widget="autocomplete"
              onChange={(_: any, agency_id: any) => {
                updateParams({ agency_id })
              }}
              multiple
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                form.current.search.value = ''
                applyParams(initialParams)
              }}
            >
              Clear all
            </Button>
            <Button
              className="relative"
              variant="contained"
              onClick={() => {
                applyParams()
              }}
            >
              Apply filters
              {unappliedParams && (
                <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-warning" />
              )}
            </Button>
          </div>
        </Box>
        <ProjectsStatistics statistics={statistics} />
      </div>
      <Box className="table-wrapper">
        <div className="mb-4 block flex-wrap justify-between gap-4 lg:flex">
          <div className="mb-4 flex justify-between gap-4 lg:mb-0">
            <Field
              name="search"
              disabled={loading}
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
                        applyParams({ search })
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
                  applyParams({ search })
                }
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-4 lg:justify-normal">
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
                      {params.ordering.label}
                      {props.open ? <IoCaretUp /> : <IoCaretDown />}
                    </Typography>
                  )
                }}
              >
                {orderings.map((item) => (
                  <Dropdown.Item
                    key={item.field}
                    onClick={() => {
                      applyParams(
                        {
                          ordering: {
                            direction: params.ordering.direction,
                            field: item.field,
                            label: item.label,
                          },
                        },
                        false,
                      )
                    }}
                  >
                    {item.label}
                  </Dropdown.Item>
                ))}
              </Dropdown>
              <IconButton
                onClick={() => {
                  const direction =
                    params.ordering.direction === 'asc' ? 'desc' : 'asc'
                  applyParams(
                    {
                      ordering: {
                        ...params.ordering,
                        direction,
                      },
                    },
                    false,
                  )
                }}
              >
                {params.ordering.direction === 'asc' ? (
                  <IoArrowUp size={16} />
                ) : (
                  <IoArrowDown size={16} />
                )}
              </IconButton>
            </div>
            <Dropdown
              color="primary"
              label={<IoDownloadOutline />}
              tooltip="Download"
              icon
            >
              <Dropdown.Item>
                <Link
                  className="flex items-center gap-x-2 text-black no-underline"
                  prefetch={false}
                  target="_blank"
                  href={formatApiUrl(
                    `api/projects/export/?get_submission=false`,
                  )}
                  download
                >
                  <AiFillFileExcel className="fill-green-700" size={24} />
                  <span>XLSX</span>
                </Link>
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
        {!!params.search && (
          <div className="mb-4">
            <Typography className="inline-flex items-center gap-2 rounded-sm border border-solid border-mui-default-border bg-action-highlight px-2 py-1 italic text-typography-secondary">
              {params.search}
              <IoClose
                className="cursor-pointer rounded-sm"
                onClick={() => {
                  form.current.search.value = ''
                  applyParams({ search: '' })
                }}
              />
            </Typography>
          </div>
        )}
        {lastChange && (
          <Alert className="mb-4" severity="info">
            <Typography>
              {lastChange.colDef.headerName} for project with code{' '}
              {`"${lastChange.data.code}"`} has been updated from{' '}
              {`"${lastChange.formattedOldValue}"`} to{' '}
              {`"${lastChange.formattedNewValue}"`}.{' '}
              <Button
                className="p-0 text-base leading-normal"
                variant="text"
                onClick={() => {
                  const rowNode = grid.current.api.getRowNode(
                    lastChange.node.id,
                  )
                  if (!rowNode) {
                    api(`api/projects/${lastChange.data.id}`, {
                      data: { [lastChange.colId]: lastChange.oldValue },
                      method: 'patch',
                    })
                      .then(() => {
                        setLastChange(null)
                        enqueueSnackbar(
                          <>{lastChange.colDef.headerName} change reverted</>,
                          {
                            variant: 'success',
                          },
                        )
                      })
                      .catch(async (error) => {
                        const errorData = await error.json()
                        enqueueSnackbar(<>{errorData[lastChange.colId]}</>, {
                          variant: 'error',
                        })
                      })
                  } else {
                    lastChange.node.setDataValue(
                      lastChange.colId,
                      lastChange.oldValue,
                      'undo-last-change',
                    )
                  }
                }}
              >
                Click here
              </Button>{' '}
              to undo.
            </Typography>
          </Alert>
        )}
        <Table
          columnDefs={gridOptions.columnDefs}
          defaultColDef={gridOptions.defaultColDef}
          domLayout="normal"
          enableCellChangeFlash={true}
          enablePagination={true}
          getRowId={(params: any) => params.data.id}
          gridRef={grid}
          loading={loading}
          noRowsOverlayComponentParams={{ label: 'No data reported' }}
          paginationPageSize={INITIAL_PAGE_SIZE}
          paginationPageSizeSelector={[10, 25, 50, 100, 250]}
          rowBuffer={50}
          rowCount={count}
          rowData={results}
          rowsVisible={25}
          suppressCellFocus={false}
          suppressColumnVirtualisation={true}
          suppressRowHoverHighlight={false}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={1}
          withSeparators={true}
          withSkeleton={true}
          onCellValueChanged={async (event) => {
            if (isEqual(event.oldValue, event.newValue)) return
            if (event.source === 'undo') {
              setLastChange(null)
              return
            }
            const colDef = event.column.getColDef()
            const colId = event.column.getColId()
            const getFormattedValue = (value: any) => {
              return (
                colDef.cellEditorParams?.getFormattedValue?.(value) || value
              )
            }
            api(`api/projects/${event.data.id}`, {
              data: { [colId]: event.newValue },
              method: 'patch',
            })
              .then((response) => {
                event.node.updateData(pick(response, keys(event.data)))
                if (event.source === 'undo-last-change') {
                  setLastChange(null)
                  enqueueSnackbar(<>{colDef.headerName} change reverted</>, {
                    variant: 'success',
                  })

                  return
                }
                setLastChange({
                  colId,
                  formattedNewValue: getFormattedValue(event.newValue),
                  formattedOldValue: getFormattedValue(event.oldValue),
                  ...event,
                })
                enqueueSnackbar(
                  <>{colDef.headerName} has been updated successfully</>,
                  {
                    variant: 'success',
                  },
                )
              })
              .catch(async (error) => {
                if (event.source === 'undo-last-change') {
                  lastChange.node.setDataValue(
                    lastChange.colId,
                    lastChange.newValue,
                    'undo',
                  )
                }
                const errorData = await error.json()
                grid.current.api.undoCellEditing()
                enqueueSnackbar(<>{errorData[colId]}</>, { variant: 'error' })
              })
          }}
          onFirstDataRendered={() => {
            debounce(autoSizeColumns, 0)
          }}
          onPaginationChanged={({ page, rowsPerPage }) => {
            applyParams(
              {
                limit: rowsPerPage,
                offset: page * rowsPerPage,
              },
              false,
            )
          }}
          onRowDataUpdated={() => {
            debounce(autoSizeColumns, 0)
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
