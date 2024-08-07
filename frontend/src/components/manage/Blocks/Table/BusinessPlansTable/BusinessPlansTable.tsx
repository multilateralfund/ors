'use client'
import React, { useContext, useMemo, useRef, useState } from 'react'

import { useParams } from 'next/navigation'

import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import { BpPathParams } from '@ors/components/manage/Blocks/BusinessPlans/types'
import TableDateSwitcher, {
  TableDataSelectorValuesType,
} from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import {
  allColumnDefs,
  commentsColumnDefs,
  odpColumnDefs,
  valuesColumnDefs,
} from '@ors/components/manage/Blocks/Table/BusinessPlansTable/schema'
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

  const [gridOptions, setGridOptions] =
    useState<TableDataSelectorValuesType>('all')

  const columnDefs = useMemo(() => {
    switch (gridOptions) {
      case 'values':
        return valuesColumnDefs(yearColumns)
      case 'odp':
        return odpColumnDefs(yearColumns)
      case 'comments':
        return commentsColumnDefs(yearColumns)
      default:
        return allColumnDefs(yearColumns)
    }
  }, [gridOptions, yearColumns])

  return (
    bpSlice.yearRanges.data &&
    bpSlice.yearRanges.data.length > 0 && (
      <form ref={form}>
        <Table
          columnDefs={[...columnDefs]}
          domLayout="autoHeight"
          loaded={loaded}
          loading={loading}
          paginationPageSize={BP_PER_PAGE}
          rowCount={count}
          rowData={results}
          tooltipShowDelay={200}
          Toolbar={() => (
            <div className="flex items-center justify-between gap-1 mb-4">
              <ActivitiesFilters
                bpSlice={bpSlice}
                clusters={clusters}
                commonSlice={commonSlice}
                filters={filters}
                form={form}
                handleFilterChange={handleFilterChange}
                handleParamsChange={handleParamsChange}
              />
              <TableDateSwitcher
                changeHandler={(event, value) => setGridOptions(value)}
                value={gridOptions}
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
            </div>
          )}
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
