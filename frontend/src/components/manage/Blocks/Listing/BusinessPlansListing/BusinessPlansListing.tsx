'use client'
import React, { useState } from 'react'

import Field from '@ors/components/manage/Form/Field'
import Table from '@ors/components/manage/Form/Table'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl, getResults } from '@ors/helpers'
import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoDownloadOutline } from 'react-icons/io5'
const PER_PAGE = 20

export default function BusinessPlansListing() {
  const bpSlice = useStore((state) => state.businessPlans)
  const defaultYear = bpSlice.yearRanges.data[0]?.year_start

  const initialParams = {
    blends: null,
    bp_chemical_type: null,
    bp_type: null,
    business_plan__agency_id: null,
    business_plan__year_end: null,
    business_plan__year_start: defaultYear,
    business_plan_id: null,
    country_id: null,
    is_multi_year: null,
    lvc_status: null,
    project_type: null,
    search: '',
    sector_id: null,
    subsector_id: null,
    substances: null,
  }

  const initialFilters = {
    business_plan__year_start: defaultYear,
    country_id: [],
    search: '',
    sector_id: [],
    subsector_id: [],
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
  const { count, loaded, results } = getResults(data)
  const yearRangeSelected = bpSlice.yearRanges.data.find(
    (item: any) => item.year_start == filters.business_plan__year_start,
  )
  const yearColumns = []
  for (
    let year = yearRangeSelected.min_year;
    year <= yearRangeSelected.max_year;
    year++
  ) {
    let label = year
    if (year === yearRangeSelected.max_year) {
      label = `After ${year - 1}`
    }

    yearColumns.push(
      {
        field: `value_usd_${year}`,
        headerName: `Value ($000) ${label}`,
        resizable: true,
        valueGetter: (params: any) =>
          params.data.values.find((i: any) => i.year === year)?.value_usd,
        width: 100,
      },
      // {
      //   id: `value_odp_${year}`,
      //   headerName: `ODP ${label}`,
      //   valueGetter: (params: any) =>
      //     params.data.values.find((i: any) => i.year === year)?.value_odp,
      // },
      // {
      //   id: `value_mt_${year}`,
      //   headerName: `MT ${label} for HFC`,
      //   valueGetter: (params: any) =>
      //     params.data.values.find((i: any) => i.year === year)?.value_mt,
      // },
    )
  }

  function handleParamsChange(params: { [key: string]: any }) {
    setParams(params)
  }

  function handleFilterChange(newFilters: { [key: string]: any }) {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  return (
    <div>
      <Table
        loaded={loaded}
        loading={loading}
        paginationPageSize={PER_PAGE}
        rowCount={count}
        rowData={results}
        Toolbar={() => (
          <div className="flex items-center justify-between">
            <Field
              className="w-64"
              Input={{ label: 'Year' }}
              options={bpSlice.yearRanges.data}
              size="large"
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
                  business_plan__year_start: value.year_start,
                  offset: 0,
                })
                handleFilterChange({
                  business_plan__year_start: value.year_start,
                })
              }}
            />
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
                    '?business_plan__year_start=' +
                    yearRangeSelected.year_start.toString()
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
                    '?business_plan__year_start=' +
                    yearRangeSelected.year_start.toString()
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
            field: 'country.iso3',
            headerName: 'Country',
            resizable: true,
            sortable: true,
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
            field: 'title',
            headerName: 'Title',
            resizable: true,
            sortable: true,
            width: 200,
          },
          {
            field: 'project_type.code',
            headerName: 'Type',
            resizable: true,
            sortable: true,
            width: 100,
          },
          {
            field: 'chemical_details',
            headerName: 'Chemical Details',
            resizable: true,
            valueGetter: ({ data }) =>
              data.substances.concat(data.blends).join('/'),
            width: 200,
          },
          {
            field: 'sector.code',
            headerName: 'Sector',
            resizable: true,
            sortable: true,
            width: 100,
          },
          {
            field: 'subsector.code',
            headerName: 'Subsector',
            resizable: true,
            sortable: true,
            width: 100,
          },
          ...yearColumns,
          {
            field: 'bp_type',
            headerName: 'A/P',
            resizable: true,
            sortable: true,
            width: 70,
          },
          {
            field: 'is_multi_year',
            headerName: 'I/M',
            resizable: true,
            sortable: true,
            valueGetter: ({ data }) => (data.is_multi_year ? 'M' : 'I'),
            width: 70,
          },
        ]}
        onPaginationChanged={({ page, rowsPerPage }) => {
          setParams({
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          })
        }}
      />
    </div>
  )
}
