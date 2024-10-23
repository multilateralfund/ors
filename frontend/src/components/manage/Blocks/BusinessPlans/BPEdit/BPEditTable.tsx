'use client'
import React, { useCallback, useContext, useMemo, useRef } from 'react'

import { findIndex, isNil, reduce } from 'lodash'
import { useParams } from 'next/navigation'

import DownloadButtons from '@ors/app/business-plans/DownloadButtons'
import {
  BPEditTableInterface,
  BpPathParams,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
import Table from '@ors/components/manage/Form/Table'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { formatApiUrl } from '@ors/helpers'
import { debounce } from '@ors/helpers/Utils/Utils'

import { filtersToQueryParams } from '../utils'
import useColumnsOptions from './editSchema'

export default function BPEditTable(props: BPEditTableInterface) {
  const { form, loading, params, setForm } = props

  const { period } = useParams<BpPathParams>()
  const year_start = period.split('-')[0]

  const { yearRanges } = useContext(BPYearRangesContext) as any

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

  const valueGetter = useCallback(
    (
      params: any,
      year: number,
      isAfterMaxYear: boolean,
      colIdentifier: string,
    ) => {
      const value = params.data.values.find((value: any) =>
        getYearColsValue(value, year, isAfterMaxYear),
      )

      if (value && !isNil(value[colIdentifier])) {
        return parseFloat(value[colIdentifier]).toFixed(2)
      }

      return null
    },
    [],
  )

  const valueSetter = useCallback(
    (
      params: any,
      year: number,
      isAfterMaxYear: boolean,
      colIdentifier: string,
    ) => {
      const value = params.data.values.find((value: any) =>
        getYearColsValue(value, year, isAfterMaxYear),
      )

      if (value) {
        value[colIdentifier] = params.newValue
      } else {
        const newValueObj = {
          [colIdentifier]: params.newValue,
          is_after: year > yearRangeSelected.max_year,
          year: Math.min(year, yearRangeSelected.max_year),
        }
        params.data.values.push(newValueObj)
      }

      return true
    },
    [yearRangeSelected?.max_year],
  )

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
        cellClass: 'ag-text-center',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          allowNullVals: true,
        },
        field: `value_usd_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) =>
          valueGetter(params, year, isAfterMaxYear, 'value_usd'),
        valueSetter: (params: any) =>
          valueSetter(params, year, isAfterMaxYear, 'value_usd'),
        wrapText: true,
      })

      valuesODP.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          allowNullVals: true,
        },
        field: `value_odp_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) =>
          valueGetter(params, year, isAfterMaxYear, 'value_odp'),
        valueSetter: (params: any) =>
          valueSetter(params, year, isAfterMaxYear, 'value_odp'),
        wrapText: true,
      })

      valuesMT.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          allowNullVals: true,
        },
        field: `value_mt_${year}`,
        headerClass: 'ag-text-center',
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) =>
          valueGetter(params, year, isAfterMaxYear, 'value_mt'),
        valueSetter: (params: any) =>
          valueSetter(params, year, isAfterMaxYear, 'value_mt'),
        wrapText: true,
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
  }, [yearRangeSelected, valueGetter, valueSetter])

  const columnOptions = useColumnsOptions(yearColumns)

  const grid = useRef<any>()

  const exportParams = useMemo(() => filtersToQueryParams(params), [params])

  const autoSizeColumns = () => {
    if (!grid.current.api) return
    grid.current.api.autoSizeColumns(
      reduce(
        columnOptions.columnDefs,
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
    yearRanges.length > 0 && (
      <>
        <DownloadButtons
          downloadTexts={['Download']}
          downloadUrls={[
            formatApiUrl(`/api/business-plan-activity/export/?${exportParams}`),
          ]}
        />
        <form>
          <Table
            columnDefs={columnOptions.columnDefs}
            defaultColDef={columnOptions.defaultColDef}
            domLayout="normal"
            gridRef={grid}
            loaded={!loading}
            loading={loading}
            rowData={form}
            tooltipShowDelay={200}
            onCellValueChanged={(event) => {
              const eventData = event.data
              const newData = [...form]

              const rowIndex = findIndex(
                newData,
                (row) => row.id === eventData.id,
              )

              if (rowIndex > -1) {
                newData.splice(rowIndex, 1, {
                  ...eventData,
                })

                setForm(newData)
              }
            }}
            onFirstDataRendered={() => {
              debounce(autoSizeColumns, 0)
            }}
            onRowDataUpdated={() => {
              debounce(autoSizeColumns, 0)
            }}
          />
        </form>
      </>
    )
  )
}
