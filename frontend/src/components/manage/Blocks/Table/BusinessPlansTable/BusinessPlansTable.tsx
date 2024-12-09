import React, { useContext, useMemo, useRef, useState } from 'react'

import { useParams } from 'wouter'

import {
  BpPathParams,
  ViewSelectorValuesType,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
import { TableDataSelectorValuesType } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import {
  allColumnDefs,
  commentsColumnDefs,
  defaultColDef,
  odpColumnDefs,
  valuesColumnDefs,
} from '@ors/components/manage/Blocks/Table/BusinessPlansTable/schema'
import ViewTable from '@ors/components/manage/Form/ViewTable'
import { Pagination } from '@ors/components/ui/Pagination/Pagination'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { getResults } from '@ors/helpers'
import { useStore } from '@ors/store'

import Activities from '../../BusinessPlans/Activities'
import BPFilters from './BPFilters'

const BP_PER_PAGE = 20

export const BPTable = ({
  bpPerPage,
  count,
  displayFilters,
  filters,
  gridOptions,
  loaded,
  loading,
  results,
  setParams,
  withAgency = false,
  yearRanges,
}: any) => {
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
    const valuesCO2 = []

    for (
      let year = yearRangeSelected.year_start;
      year <= yearRangeSelected.year_end + 1;
      year++
    ) {
      const isAfterMaxYear = year > yearRangeSelected.year_end

      let label = year
      if (isAfterMaxYear) {
        label = `After ${yearRangeSelected.year_end}`
      }

      valuesUSD.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        field: `value_usd_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
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
        cellClass: 'ag-text-center',
        field: `value_odp_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
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
        cellClass: 'ag-text-center',
        field: `value_mt_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
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

      valuesCO2.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        field: `value_co2_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) => {
          const value = params.data.values.find((value: any) =>
            getYearColsValue(value, year, isAfterMaxYear),
          )
          if (value && value.value_co2 !== null) {
            return parseFloat(value.value_co2).toFixed(2)
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
      {
        children: valuesCO2,
        headerName: 'CO2-EQ',
        headerGroupComponent: () => (
          <div className="mt-1 text-[12px]">
            CO<sub>2</sub>-EQ
          </div>
        ),
      },
    ]
  }, [yearRangeSelected])

  const columnDefs = useMemo(() => {
    switch (gridOptions) {
      case 'values':
        return valuesColumnDefs(yearColumns, false, withAgency)
      case 'odp':
        return odpColumnDefs(yearColumns, false, withAgency)
      case 'comments':
        return commentsColumnDefs(false, withAgency)
      default:
        return allColumnDefs(yearColumns, false, withAgency)
    }
  }, [gridOptions, yearColumns, withAgency])

  const getPaginationSelectorOpts = (): number[] => {
    const nrResultsOpts = [10, 20, 50, 100]
    const filteredNrResultsOptions = nrResultsOpts.filter(
      (option) => option < count,
    )
    return [...filteredNrResultsOptions, count]
  }
  const paginationPageSizeSelectorOpts = getPaginationSelectorOpts()

  return (
    <ViewTable
      Toolbar={displayFilters}
      columnDefs={[...columnDefs]}
      defaultColDef={defaultColDef}
      domLayout="normal"
      enablePagination={true}
      loaded={loaded}
      loading={loading}
      paginationPageSize={bpPerPage || BP_PER_PAGE}
      paginationPageSizeSelector={paginationPageSizeSelectorOpts}
      resizeGridOnRowUpdate={true}
      rowBuffer={50}
      rowCount={count}
      rowData={results}
      rowsVisible={20}
      tooltipShowDelay={200}
      context={{ disableValidation: true }}
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
  )
}

export default function BusinessPlansTable() {
  const { period } = useParams<BpPathParams>()
  const form = useRef<any>()

  const initialFilters = {
    country_id: [],
    is_multi_year: [],
    project_cluster_id: [],
    project_type_id: [],
    search: '',
    sector_id: [],
    subsector_id: [],
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

  const [gridOptions, setGridOptions] =
    useState<TableDataSelectorValuesType>('all')

  const [displayOptions, setDisplayOptions] =
    useState<ViewSelectorValuesType>('table')

  const { bpType } = useStore((state) => state.bpType)
  const key = JSON.stringify(filters) + '-' + bpType

  const displayFilters = () => (
    <BPFilters
      {...{
        displayOptions,
        filters,
        form,
        gridOptions,
        initialFilters,
        reqParams,
        setDisplayOptions,
        setFilters,
        setGridOptions,
        setParams,
      }}
    />
  )

  return (
    yearRanges &&
    yearRanges.length > 0 && (
      <form ref={form}>
        {displayOptions === 'table' ? (
          <BPTable
            key={key}
            {...{
              count,
              displayFilters,
              filters,
              gridOptions,
              loaded,
              loading,
              results,
              setParams,
              yearRanges,
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
