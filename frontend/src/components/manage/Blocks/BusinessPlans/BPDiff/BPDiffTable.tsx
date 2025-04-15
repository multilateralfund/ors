'use client'
import React, { useContext, useMemo, useRef, useState } from 'react'

import { reduce } from 'lodash'
import { useParams } from 'wouter'

import {
  BPDataInterface,
  BpPathParams,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
import TableDateSwitcher, {
  TableDataSelectorValuesType,
} from '@ors/components/manage/Blocks/Table/BusinessPlansTable/TableDateSwitcher'
import Table from '@ors/components/manage/Form/Table'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { debounce } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import {
  allColumnDefs,
  commentsColumnDefs,
  defaultColDef,
  odpColumnDefs,
  valuesColumnDefs,
} from '../../Table/BusinessPlansTable/schema'
import { numberCellRenderer } from '../../Table/BusinessPlansTable/schemaHelpers'

export default function BPDiffTable({
  diffData,
}: {
  diffData: BPDataInterface
}) {
  const form = useRef<any>()

  const { period } = useParams<BpPathParams>()
  const year_start = period.split('-')[0]

  const { yearRanges } = useContext(BPYearRangesContext) as any

  const { loaded, loading, results } = diffData || {}

  const yearRangeSelected = useMemo(
    () => yearRanges.find((item: any) => item.year_start == year_start),
    [yearRanges, year_start],
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

      const valuesCellGetter = (params: any, colIdentifier: string) => {
        const value = params.data.values.find((value: any) =>
          getYearColsValue(value, year, isAfterMaxYear),
        )

        const change_type = params.data.change_type
        const new_val = value?.[colIdentifier]
        const old_val = value?.[colIdentifier + '_old']

        return {
          change_type: change_type,
          new_value: new_val ? parseFloat(new_val).toFixed(2) : '-',
          old_value: old_val ? parseFloat(old_val).toFixed(2) : '-',
        }
      }

      valuesUSD.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellRenderer: numberCellRenderer,
        field: `value_usd_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) => valuesCellGetter(params, 'value_usd'),
      })

      valuesODP.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellRenderer: numberCellRenderer,
        field: `value_odp_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) => valuesCellGetter(params, 'value_odp'),
      })

      valuesMT.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellRenderer: numberCellRenderer,
        field: `value_mt_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) => valuesCellGetter(params, 'value_mt'),
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

  const [gridOptions, setGridOptions] =
    useState<TableDataSelectorValuesType>('all')

  const columnDefs = useMemo(() => {
    switch (gridOptions) {
      case 'values':
        return valuesColumnDefs(yearColumns, true, false)
      case 'odp':
        return odpColumnDefs(yearColumns, true, false)
      case 'comments':
        return commentsColumnDefs(true, false)
      default:
        return allColumnDefs(yearColumns, true, false)
    }
  }, [gridOptions, yearColumns])

  const { currentVersion, previousVersion } = useStore(
    (state) => state.bp_diff_versions,
  )

  const noResultsMessage = `There are no differences between versions ${currentVersion || '-'} and
   ${previousVersion || '-'}`

  const displayFilters = () => {
    return (
      <div className="bp-table-toolbar mb-4 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="ml-auto flex gap-4">
          <TableDateSwitcher
            changeHandler={setGridOptions}
            value={gridOptions}
          />
        </div>
      </div>
    )
  }

  const grid = useRef<any>()

  const autoSizeColumns = () => {
    if (!grid.current.api) return
    grid.current.api.autoSizeColumns(
      reduce(
        columnDefs,
        (acc: Array<string>, column) => {
          acc.push(column.field)
          return acc
        },
        [],
      ),
    )
  }

  return (
    yearRanges &&
    yearRanges.length > 0 &&
    results?.length > 0 && (
      <form ref={form}>
        <Table
          className="bp-diff-table"
          Toolbar={displayFilters}
          columnDefs={[...columnDefs]}
          defaultColDef={defaultColDef}
          domLayout="normal"
          gridRef={grid}
          loaded={loaded}
          loading={loading}
          noRowsOverlayComponentParams={{ label: noResultsMessage }}
          rowData={results}
          tooltipShowDelay={200}
          components={{
            agColumnHeader: undefined,
            agTextCellRenderer: undefined,
          }}
          onFirstDataRendered={() => {
            debounce(autoSizeColumns, 0)
          }}
          onRowDataUpdated={() => {
            debounce(autoSizeColumns, 0)
          }}
        />
      </form>
    )
  )
}
