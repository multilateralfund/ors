'use client'
import React, { useContext, useMemo, useRef, useState } from 'react'

import { useParams } from 'next/navigation'

import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import { BpPathParams } from '@ors/components/manage/Blocks/BusinessPlans/types'
import Table from '@ors/components/manage/Form/Table'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import { getResults } from '@ors/helpers'
import { useStore } from '@ors/store'

const BP_PER_PAGE = 20

export default function BusinessPlansTable() {
  const params = useParams<BpPathParams>()
  const { period } = params
  const form = useRef<any>()
  const commonSlice = useStore((state) => state.common)
  const bpSlice = useStore((state) => state.businessPlans)
  const projects = useStore((state) => state.projects)

  const clusters = projects.clusters.data || []

  const initialFilters = {
    country_id: [],
    is_multi_year: true,
    project_cluster_id: [],
    project_type_id: [],
    search: '',
    sector_id: [],
    subsector_id: [],
    // year_end: end_year,
    year_start: period.split('-')[0],
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
            <>
              <ActivitiesFilters
                bpSlice={bpSlice}
                clusters={clusters}
                commonSlice={commonSlice}
                filters={filters}
                form={form}
                handleFilterChange={handleFilterChange}
                handleParamsChange={handleParamsChange}
              />
              {/*<Dropdown*/}
              {/*  color="primary"*/}
              {/*  label={<IoDownloadOutline />}*/}
              {/*  tooltip="Download"*/}
              {/*  icon*/}
              {/*>*/}
              {/*  <Dropdown.Item>*/}
              {/*    <Link*/}
              {/*      className="flex items-center gap-x-2 text-black no-underline"*/}
              {/*      target="_blank"*/}
              {/*      href={*/}
              {/*        formatApiUrl('api/business-plan-record/export/') +*/}
              {/*        '?year_start=' +*/}
              {/*        yearRangeSelected?.year_start.toString()*/}
              {/*      }*/}
              {/*      download*/}
              {/*    >*/}
              {/*      <AiFillFileExcel className="fill-green-700" size={24} />*/}
              {/*      <span>XLSX</span>*/}
              {/*    </Link>*/}
              {/*  </Dropdown.Item>*/}
              {/*  <Dropdown.Item>*/}
              {/*    <Link*/}
              {/*      className="flex items-center gap-x-2 text-black no-underline"*/}
              {/*      target="_blank"*/}
              {/*      href={*/}
              {/*        formatApiUrl('api/business-plan-record/print/') +*/}
              {/*        '?year_start=' +*/}
              {/*        yearRangeSelected?.year_start.toString()*/}
              {/*      }*/}
              {/*      download*/}
              {/*    >*/}
              {/*      <AiFillFilePdf className="fill-red-700" size={24} />*/}
              {/*      <span>PDF</span>*/}
              {/*    </Link>*/}
              {/*  </Dropdown.Item>*/}
              {/*</Dropdown>*/}
            </>
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
