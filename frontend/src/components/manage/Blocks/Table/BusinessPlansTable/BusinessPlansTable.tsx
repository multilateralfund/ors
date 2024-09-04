'use client'
import React, { useContext, useMemo, useRef, useState } from 'react'

import { useParams } from 'next/navigation'

import DownloadButtons from '@ors/app/business-plans/DownloadButtons'
import ActivitiesFilters from '@ors/components/manage/Blocks/BusinessPlans/ActivitiesFilters'
import {
  BpPathParams,
  ViewSelectorValuesType,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
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
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { formatApiUrl, getResults } from '@ors/helpers'
import { useStore } from '@ors/store'

import Activities from '../../BusinessPlans/Activities'
import { filtersToQueryParams } from '../../BusinessPlans/utils'
import TableViewSelector from './TableViewSelector'

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
    comment_types: [],
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
  const {
    data,
    loading,
    params: reqParams,
    setParams,
  } = useContext(BPContext) as any
  const { yearRanges } = useContext(BPYearRangesContext) as any

  const count = data?.count || 0
  const activities = data?.results?.activities
  const { loaded, results } = getResults(activities)

  const [pagination, setPagination] = useState({
    page: 1,
    rowsPerPage: BP_PER_PAGE,
  })
  const pages = Math.ceil(count / pagination.rowsPerPage)

  const yearRangeSelected = useMemo(
    () => yearRanges.find((item: any) => item.year_start == filters.year_start),
    [yearRanges, filters.year_start],
  )

  const getYearColsValue = (
    value: any,
    year: number,
    isAfterMaxYear: boolean,
  ) =>
    isAfterMaxYear ? value.is_after : value.year === year && !value.is_after

  const yearColumns = useMemo(() => {
    if (!yearRangeSelected) return []

    const valuesUSD = []
    const valuesODP = []
    const valuesMT = []

    for (
      let year = yearRangeSelected.min_year;
      year <= yearRangeSelected.max_year + 1;
      year++
    ) {
      const isAfterMaxYear = year > yearRangeSelected.max_year

      let label = year
      if (isAfterMaxYear) {
        label = `After ${yearRangeSelected.max_year}`
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
          const value = params.data.values.find((value: any) =>
            getYearColsValue(value, year, isAfterMaxYear),
          )
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
          const value = params.data.values.find((value: any) =>
            getYearColsValue(value, year, isAfterMaxYear),
          )
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
          const value = params.data.values.find((value: any) =>
            getYearColsValue(value, year, isAfterMaxYear),
          )
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

  const [displayOptions, setDisplayOptions] =
    useState<ViewSelectorValuesType>('table')

  const columnDefs = useMemo(() => {
    switch (gridOptions) {
      case 'values':
        return valuesColumnDefs(yearColumns)
      case 'odp':
        return odpColumnDefs(yearColumns)
      case 'comments':
        return commentsColumnDefs()
      default:
        return allColumnDefs(yearColumns)
    }
  }, [gridOptions, yearColumns])

  const exportParams = useMemo(
    () => filtersToQueryParams(reqParams),
    [reqParams],
  )

  const displayFilters = () => {
    return (
      <div className="bp-table-toolbar mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <DownloadButtons
          downloadTexts={['Download']}
          downloadUrls={[
            formatApiUrl(`/api/business-plan-activity/export/?${exportParams}`),
          ]}
        />
        <ActivitiesFilters
          bpSlice={bpSlice}
          clusters={clusters}
          commonSlice={commonSlice}
          filters={filters}
          form={form}
          handleFilterChange={handleFilterChange}
          handleParamsChange={handleParamsChange}
          initialFilters={initialFilters}
        />
        <div className="flex gap-4 self-start">
          <TableViewSelector
            changeHandler={(_, value) => setDisplayOptions(value)}
            value={displayOptions}
          />
          <TableDateSwitcher
            changeHandler={(event, value) => setGridOptions(value)}
            value={gridOptions}
          />
        </div>
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
    )
  }

  const getPaginationSelectorOpts = (): number[] => {
    const nrResultsOpts = [10, 20, 50, 100]
    const filteredNrResultsOptions = nrResultsOpts.filter(
      (option) => option < count,
    )
    return [...filteredNrResultsOptions, count]
  }
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts()

  return (
    yearRanges &&
    yearRanges.length > 0 && (
      <form ref={form}>
        {displayOptions === 'table' ? (
          <Table
            Toolbar={displayFilters}
            columnDefs={[...columnDefs]}
            domLayout="normal"
            enablePagination={true}
            loaded={loaded}
            loading={loading}
            paginationPageSize={BP_PER_PAGE}
            paginationPageSizeSelector={paginationPageSizeSelectorOpts}
            rowBuffer={50}
            rowCount={count}
            rowData={results}
            rowsVisible={25}
            tooltipShowDelay={200}
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
        ) : (
          <>
            {displayFilters()}
            <Activities
              {...{
                gridOptions,
                loaded,
                period,
                results,
              }}
            />
            {!!pages && pages > 1 && (
              <div className="mt-4 flex items-center justify-start">
                <Pagination
                  count={pages}
                  page={pagination.page}
                  siblingCount={1}
                  onPaginationChanged={(page) => {
                    setPagination({ ...pagination, page: page || 1 })
                    setParams({
                      limit: pagination.rowsPerPage,
                      offset: ((page || 1) - 1) * pagination.rowsPerPage,
                    })
                  }}
                />
              </div>
            )}
          </>
        )}
      </form>
    )
  )
}
