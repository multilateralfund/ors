// @ts-nocheck
'use client'
import React, { useMemo, useRef, useState } from 'react'

import {
  InputAdornment,
  IconButton as MuiIconButton,
  Typography,
} from '@mui/material'
import { useParams } from 'next/navigation'

import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import { KEY_ENTER } from '@ors/constants'
import { formatApiUrl, getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoClose, IoDownloadOutline, IoSearchOutline } from 'react-icons/io5'

const PER_PAGE = 20

export default function BusinessPlansTable() {
  const params = useParams<{
    agency: string
    end_year: string
    start_year: string
  }>()
  const { agency, end_year, start_year } = params
  const form = useRef<any>()
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  // const defaultYearStart = bpSlice.yearRanges.data[0]?.year_start
  // const defaultYearEnd = bpSlice.yearRanges.data[0]?.year_end

  const currentAgency = useMemo(() => {
    return commonSlice.agencies.data.find((item: any) => item.name === agency)
  }, [agency, commonSlice.agencies.data])

  const initialParams = {
    agency_id: currentAgency.id,
    blends: null,
    bp_chemical_type: null,
    bp_type: null,
    business_plan_id: null,
    country_id: null,
    is_multi_year: null,
    lvc_status: null,
    ordering: null,
    project_type_id: null,
    search: '',
    sector_id: null,
    subsector_id: null,
    substances: null,
    year_end: end_year,
    year_start: start_year,
  }

  const initialFilters = {
    country_id: [],
    project_type_id: [],
    search: '',
    sector_id: [],
    subsector_id: [],
    // year_end: end_year,
    year_start: start_year,
  }

  const [filters, setFilters] = useState({ ...initialFilters })

  const { data, loading, setParams } = useApi({
    options: {
      params: {
        limit: PER_PAGE,
        offset: 0,
        ...initialParams,
      },
      withStoreCache: true,
    },
    path: 'api/business-plan-record/',
  })
  const { count, loaded, results } = getResults(data?.results?.records)

  const yearRangeSelected = useMemo(
    () =>
      bpSlice.yearRanges.data.find(
        (item: any) => item.year_start == filters.year_start,
      ),
    [bpSlice.yearRanges.data, filters.year_start],
  )
  const yearColumns = useMemo(() => {
    if (!yearRangeSelected) return []

    const result = []

    for (
      let year = yearRangeSelected.min_year;
      year <= yearRangeSelected.max_year;
      year++
    ) {
      let label = year
      if (year === yearRangeSelected.max_year) {
        label = `After ${year - 1}`
      }

      result.push({
        autoHeaderHeight: true,
        field: `value_usd_${year}`,
        headerName: `Value ($000) ${label}`,
        resizable: true,
        valueGetter: (params: any) => {
          const value = params.data.values.find((i: any) => i.year === year)
          if (value) {
            return parseFloat(value.value_usd)
          }
          return ''
        },
        width: 120,
      })
    }
    return result
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
          loaded={loaded}
          loading={loading}
          paginationPageSize={PER_PAGE}
          rowCount={count}
          rowData={results}
          tooltipShowDelay={200}
          Toolbar={() => (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-64">
                  <Field
                    Input={{ label: 'Year' }}
                    options={bpSlice.yearRanges.data}
                    value={yearRangeSelected}
                    widget="autocomplete"
                    getOptionLabel={(option: any) =>
                      `${option.year_start}-${option.year_end}`
                    }
                    isOptionEqualToValue={(option: any, value: any) =>
                      option.year_start === value
                    }
                    onChange={(_: any, value: any) => {
                      handleParamsChange({
                        offset: 0,
                        year_end: value.year_end,
                        year_start: value.year_start,
                      })
                      handleFilterChange({
                        year_end: value.year_end,
                        year_start: value.year_start,
                      })
                    }}
                    disableClearable
                  />
                </div>
                <div className="w-80">
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
                </div>
                <div className="w-64">
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
                        sector_id: value.map((item: any) => item.id).join(','),
                      })
                    }}
                    multiple
                  />
                </div>
                <div className="w-64">
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
                <div className="w-64">
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
                      formatApiUrl('api/business-plan-record/export/') +
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
                      formatApiUrl('api/business-plan-record/print/') +
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
          )}
          columnDefs={[
            {
              cellRenderer: (params: any) => (
                <Link href={`/business-plans/${params.data.id}`}>
                  {params.data.title}
                </Link>
              ),
              field: 'title',
              headerName: 'Title',
              resizable: true,
              sortable: true,
              tooltipField: 'title',
              width: 200,
            },
            {
              field: 'country.iso3',
              headerName: 'Country',
              resizable: true,
              sortable: true,
              tooltipField: 'country.name',
              width: 100,
            },
            {
              field: 'business_plan.agency.name',
              headerName: 'Agency',
              resizable: true,
              sortable: true,
              width: 100,
            },
            {
              field: 'project_type.code',
              headerName: 'Type',
              resizable: true,
              sortable: true,
              tooltipField: 'project_type.name',
              width: 100,
            },
            {
              autoHeaderHeight: true,
              field: 'chemical_details',
              headerName: 'Chemical Details',
              resizable: true,
              valueGetter: ({ data }) =>
                data.substances.concat(data.blends).join('/'),
              width: 100,
            },
            {
              field: 'sector.code',
              headerName: 'Sector',
              resizable: true,
              sortable: true,
              tooltipField: 'sector.name',
              width: 100,
            },
            {
              field: 'subsector.code',
              headerName: 'Subsector',
              resizable: true,
              sortable: true,
              tooltipField: 'subsector.name',
              width: 100,
            },
            ...yearColumns,
            {
              field: 'bp_type',
              headerName: 'Approved / Planned',
              resizable: true,
              sortable: true,
              tooltipField: 'bp_type_display',
              width: 100,
            },
            {
              field: 'is_multi_year',
              headerName: 'IND/MYA',
              resizable: true,
              sortable: true,
              tooltipField: 'is_multi_year_display',
              valueGetter: ({ data }) => (data.is_multi_year ? 'MYA' : 'IND'),
              width: 100,
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
