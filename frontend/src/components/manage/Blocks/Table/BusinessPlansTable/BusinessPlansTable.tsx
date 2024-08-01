'use client'
import React, { useContext, useMemo, useRef, useState } from 'react'

import {
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton as MuiIconButton,
  Typography,
} from '@mui/material'
import { useParams } from 'next/navigation'

import { BpPathParams } from '@ors/components/manage/Blocks/BusinessPlans/types'
import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import { KEY_ENTER } from '@ors/constants'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import { formatApiUrl, getResults } from '@ors/helpers'
import { useStore } from '@ors/store'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoClose, IoDownloadOutline, IoSearchOutline } from 'react-icons/io5'

const BP_PER_PAGE = 20

export default function BusinessPlansTable() {
  const params = useParams<BpPathParams>()
  const { start_year } = params
  const form = useRef<any>()
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  const projects = useStore((state) => state.projects)

  const clusters = projects.clusters.data || []

  // const initialParams = {
  //   blends: null,
  //   bp_chemical_type: null,
  //   status: null,
  //   business_plan_id: null,
  //   country_id: null,
  //   is_multi_year: null,
  //   limit: BP_PER_PAGE,
  //   lvc_status: null,
  //   offset: 0,
  //   ordering: null,
  //   project_type_id: null,
  //   search: '',
  //   sector_id: null,
  //   subsector_id: null,
  //   substances: null,
  // }

  const initialFilters = {
    country_id: [],
    is_multi_year: true,
    project_cluster_id: [],
    project_type_id: [],
    search: '',
    sector_id: [],
    subsector_id: [],
    // year_end: end_year,
    year_start: start_year,
  }

  const [filters, setFilters] = useState({ ...initialFilters })
  const { data, loading, setParams } = useContext(BPContext) as any
  const activities = data?.results?.activities
  const { count, loaded, results } = getResults(activities)

  const yearRangeSelected = useMemo(
    () =>
      bpSlice.yearRanges.data.find(
        (item: any) => item.year_start == filters.year_start,
      ),
    [bpSlice.yearRanges.data, filters.year_start],
  )
  const yearColumns = useMemo(() => {
    if (!yearRangeSelected) return []

    const valuesUSD = []
    const valuesODP = []
    const valuesMT = []

    for (
      let year = yearRangeSelected.min_year;
      year <= yearRangeSelected.max_year;
      year++
    ) {
      let label = year
      if (year === yearRangeSelected.max_year) {
        label = `After ${year - 1}`
      }

      valuesUSD.push({
        autoHeaderHeight: true,
        autoHeight: true,
        cellClass: 'ag-text-center',
        field: `value_usd_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        resizable: true,
        valueGetter: (params: any) => {
          const value = params.data.values.find((i: any) => i.year === year)
          if (value && value.value_usd !== null) {
            return parseFloat(value.value_usd).toFixed(2)
          }
          return ''
        },
      })

      valuesODP.push({
        autoHeaderHeight: true,
        autoHeight: true,
        cellClass: 'ag-text-center',
        field: `value_odp_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        resizable: true,
        valueGetter: (params: any) => {
          const value = params.data.values.find((i: any) => i.year === year)
          if (value && value.value_odp !== null) {
            return parseFloat(value.value_odp).toFixed(2)
          }
          return ''
        },
      })

      valuesMT.push({
        autoHeaderHeight: true,
        autoHeight: true,
        cellClass: 'ag-text-center',
        field: `value_mt_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        resizable: true,
        valueGetter: (params: any) => {
          const value = params.data.values.find((i: any) => i.year === year)
          if (value && value.value_mt !== null) {
            return parseFloat(value.value_mt).toFixed(2)
          }
          return ''
        },
      })
    }

    return [
      {
        children: valuesUSD,
        headerName: 'Value ($000)',
      },
      {
        children: valuesODP,
        headerName: 'ODP',
      },
      {
        children: valuesMT,
        headerName: 'MT for HFC',
      },
    ]
  }, [yearRangeSelected])

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  return (
    bpSlice.yearRanges.data &&
    bpSlice.yearRanges.data.length > 0 && (
      <form ref={form}>
        <Table
          domLayout="autoHeight"
          loaded={loaded}
          loading={loading}
          paginationPageSize={BP_PER_PAGE}
          rowCount={count}
          rowData={results}
          tooltipShowDelay={200}
          Toolbar={() => (
            <div className="flex flex-col">
              {/*  First row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <Field
                    name="search"
                    placeholder="Search by keyword..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MuiIconButton
                            aria-label="search table"
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
                  {/*<div className="w-52">*/}
                  {/*  <Field*/}
                  {/*    Input={{ label: 'Year' }}*/}
                  {/*    options={bpSlice.yearRanges.data}*/}
                  {/*    value={yearRangeSelected}*/}
                  {/*    widget="autocomplete"*/}
                  {/*    getOptionLabel={(option: any) =>*/}
                  {/*      `${option.year_start}-${option.year_end}`*/}
                  {/*    }*/}
                  {/*    isOptionEqualToValue={(option: any, value: any) =>*/}
                  {/*      option.year_start === value.year_start*/}
                  {/*    }*/}
                  {/*    onChange={(_: any, value: any) => {*/}
                  {/*      handleParamsChange({*/}
                  {/*        offset: 0,*/}
                  {/*        year_end: value.year_end,*/}
                  {/*        year_start: value.year_start,*/}
                  {/*      })*/}
                  {/*      handleFilterChange({*/}
                  {/*        year_end: value.year_end,*/}
                  {/*        year_start: value.year_start,*/}
                  {/*      })*/}
                  {/*    }}*/}
                  {/*    disableClearable*/}
                  {/*  />*/}
                  {/*</div>*/}
                  <div className="w-40">
                    <Field
                      Input={{ label: 'Country' }}
                      getOptionLabel={(option: any) => option?.name}
                      options={commonSlice.countries.data}
                      value={filters.country_id}
                      widget="autocomplete"
                      onChange={(_: any, value: any) => {
                        handleFilterChange({ country_id: value })
                        handleParamsChange({
                          country_id: value
                            .map((item: any) => item.id)
                            .join(','),
                          offset: 0,
                        })
                      }}
                      multiple
                    />
                  </div>
                  <div className="w-40">
                    <Field
                      Input={{ label: 'Cluster' }}
                      getOptionLabel={(option: any) => option?.name}
                      options={clusters}
                      value={filters.project_cluster_id}
                      widget="autocomplete"
                      onChange={(_: any, value: any) => {
                        handleFilterChange({ project_cluster_id: value })
                        handleParamsChange({
                          offset: 0,
                          project_cluster_id: value
                            .map((item: any) => item.id)
                            .join(','),
                        })
                      }}
                      multiple
                    />
                  </div>
                  <div className="w-40">
                    <Field
                      Input={{ label: 'Sector' }}
                      getOptionLabel={(option: any) => option?.name}
                      options={bpSlice.sectors.data}
                      value={filters.sector_id}
                      widget="autocomplete"
                      onChange={(_: any, value: any) => {
                        handleFilterChange({ sector_id: value })
                        handleParamsChange({
                          offset: 0,
                          sector_id: value
                            .map((item: any) => item.id)
                            .join(','),
                        })
                      }}
                      multiple
                    />
                  </div>
                  <div className="w-40">
                    <Field
                      Input={{ label: 'Subsector' }}
                      getOptionLabel={(option: any) => option?.name}
                      options={bpSlice.subsectors.data}
                      value={filters.subsector_id}
                      widget="autocomplete"
                      onChange={(_: any, value: any) => {
                        handleFilterChange({ subsector_id: value })
                        handleParamsChange({
                          offset: 0,
                          subsector_id: value
                            .map((item: any) => item.id)
                            .join(','),
                        })
                      }}
                      multiple
                    />
                  </div>
                  <div className="w-40">
                    <Field
                      Input={{ label: 'Type' }}
                      getOptionLabel={(option: any) => option?.name}
                      options={bpSlice.types.data}
                      value={filters.project_type_id}
                      widget="autocomplete"
                      isOptionEqualToValue={(option: any, value: any) =>
                        option.id === value
                      }
                      onChange={(_: any, value: any) => {
                        handleFilterChange({ project_type_id: value })
                        handleParamsChange({
                          offset: 0,
                          project_type_id: value
                            .map((item: any) => item.id)
                            .join(','),
                        })
                      }}
                      multiple
                    />
                  </div>
                  <FormControlLabel
                    className="widget"
                    label="Multi-Year"
                    control={
                      <Checkbox
                        checked={filters.is_multi_year}
                        onChange={(event) => {
                          handleFilterChange({
                            is_multi_year: event.target.checked,
                          })
                          handleParamsChange({
                            is_multi_year: event.target.checked,
                            offset: 0,
                          })
                        }}
                      />
                    }
                  />
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
                      target="_blank"
                      href={
                        formatApiUrl('api/business-plan-activity/export/') +
                        '?year_start=' +
                        yearRangeSelected?.year_start.toString()
                      }
                      download
                    >
                      <AiFillFileExcel className="fill-green-700" size={24} />
                      <span>XLSX</span>
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <Link
                      className="flex items-center gap-x-2 text-black no-underline"
                      target="_blank"
                      href={
                        formatApiUrl('api/business-plan-activity/print/') +
                        '?year_start=' +
                        yearRangeSelected?.year_start.toString()
                      }
                      download
                    >
                      <AiFillFilePdf className="fill-red-700" size={24} />
                      <span>PDF</span>
                    </Link>
                  </Dropdown.Item>
                </Dropdown>
              </div>
              {/* Second row  */}
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
            </div>
          )}
          columnDefs={[
            {
              autoHeight: true,
              // cellRenderer: (params: any) => (
              //   <Link href={`/business-plans/${params.data.id}`}>
              //     {params.data.title}
              //   </Link>
              // ),
              field: 'title',
              headerName: 'Title',
              minWidth: 200,
              resizable: true,
              sortable: true,
              tooltipField: 'title',
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'country.iso3',
              headerClass: 'ag-text-center',
              headerName: 'Country',
              minWidth: 70,
              resizable: true,
              sortable: true,
              tooltipField: 'country.name',
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'project_cluster',
              headerClass: 'ag-text-center',
              headerName: 'Cluster',
              minWidth: 70,
              resizable: true,
              sortable: true,
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'project_type.code',
              headerClass: 'ag-text-center',
              headerName: 'Type',
              minWidth: 70,
              resizable: true,
              sortable: true,
              tooltipField: 'project_type.name',
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'sector.code',
              headerClass: 'ag-text-center',
              headerName: 'Sector',
              minWidth: 70,
              resizable: true,
              sortable: true,
              tooltipField: 'sector.name',
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'subsector.code',
              headerClass: 'ag-text-center',
              headerName: 'Subsector',
              minWidth: 100,
              resizable: true,
              sortable: true,
              tooltipField: 'subsector.name',
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center ag-cell-wrap-text',
              field: 'required_by_model',
              headerClass: 'ag-text-center',
              headerName: 'Required by model',
              minWidth: 150,
              resizable: true,
              sortable: true,
            },
            {
              autoHeight: true,
              // cellRenderer: (params: any) => (
              //   <Link href={`/business-plans/${params.data.id}`}>
              //     {params.data.title}
              //   </Link>
              // ),
              field: 'substances',
              headerClass: 'ag-text-center',
              headerName: 'Substances',
              minWidth: 200,
              resizable: true,
              sortable: true,
              valueGetter: ({ data }) => data.substances.join('/'),
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'amount_polyol',
              headerClass: 'ag-text-center',
              headerName: 'Polyol Amount',
              minWidth: 100,
              resizable: true,
              sortable: true,
            },
            ...yearColumns,
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'status',
              headerClass: 'ag-text-center',
              headerName: 'Status',
              minWidth: 100,
              resizable: true,
              sortable: true,
              tooltipField: 'status_display',
            },
            {
              autoHeight: true,
              cellClass: 'ag-text-center',
              field: 'is_multi_year',
              headerClass: 'ag-text-center',
              headerName: 'IND/MYA',
              minWidth: 100,
              resizable: true,
              sortable: true,
              tooltipField: 'is_multi_year_display',
              valueGetter: ({ data }) => (data.is_multi_year ? 'MYA' : 'IND'),
            },
            {
              autoHeight: true,
              field: 'reason_for_exceeding',
              headerClass: 'ag-text-center',
              headerName: 'Reason for Exceeding',
              minWidth: 200,
              resizable: true,
              sortable: true,
            },
            {
              autoHeight: true,
              field: 'comment_secretariat',
              headerClass: 'ag-text-center',
              headerName: 'Comment',
              minWidth: 200,
              resizable: true,
              sortable: true,
            },
          ]}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onPaginationChanged={({ page, rowsPerPage }) => {
            setParams({
              limit: rowsPerPage,
              offset: page * rowsPerPage,
            })
          }}
          onSortChanged={({ api }) => {
            const ordering = api
              .getColumnState()
              .filter((column) => !!column.sort)
              .map(
                (column) =>
                  (column.sort === 'asc' ? '' : '-') +
                  column.colId.replaceAll('.', '__'),
              )
              .join(',')
            setParams({ offset: 0, ordering })
          }}
        />
      </form>
    )
  )
}
