'use client'
import { ApiBPYearRange } from '@ors/types/api_bp_get_years'

import { useCallback, useContext, useMemo, useRef } from 'react'

import { Button } from '@mui/material'
import { findIndex, isNil } from 'lodash'
import { useParams } from 'wouter'

import {
  BPEditTableInterface,
  BpPathParams,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
import Table from '@ors/components/manage/Form/Table'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { applyTransaction } from '@ors/helpers'

import useColumnsOptions from './editSchema'
import { BasePasteWrapper } from './pasteSupport'

import { IoAddCircle } from 'react-icons/io5'

export function BPEditBaseTable(
  props: { yearRangeSelected: ApiBPYearRange } & BPEditTableInterface,
) {
  const {
    form = [],
    isConsolidatedView = false,
    loading,
    setForm,
    yearRangeSelected,
  } = props

  const grid = useRef<any>()

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
        return parseFloat(value[colIdentifier])
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
          is_after: year > yearRangeSelected.year_end,
          year: Math.min(year, yearRangeSelected.year_end),
        }
        params.data.values.push(newValueObj)
      }

      return true
    },
    [yearRangeSelected?.year_end],
  )

  const yearColumns: { children: any[]; headerName: string }[] = useMemo(() => {
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

      let label = year.toString()
      if (isAfterMaxYear) {
        label = `After ${yearRangeSelected.year_end}`
      }

      valuesUSD.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          allowNullVals: true,
        },
        cellRendererParams: () => ({
          tooltipClassName: 'bp-table-tooltip',
        }),
        dataType: 'number',
        field: `value_usd_${year}`,
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              label={props.displayName}
              setForm={setForm}
              mutator={function (row: any, value: any) {
                valueSetter(
                  { data: row, newValue: value },
                  year,
                  isAfterMaxYear,
                  'value_usd',
                )
              }}
            />
          )
        },
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
        cellRendererParams: () => ({
          tooltipClassName: 'bp-table-tooltip',
        }),
        dataType: 'number',
        field: `value_odp_${year}`,
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              label={props.displayName}
              setForm={setForm}
              mutator={function (row: any, value: any) {
                valueSetter(
                  { data: row, newValue: value },
                  year,
                  isAfterMaxYear,
                  'value_odp',
                )
              }}
            />
          )
        },
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
        cellRendererParams: () => ({
          tooltipClassName: 'bp-table-tooltip',
        }),
        dataType: 'number',
        field: `value_mt_${year}`,
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              label={props.displayName}
              setForm={setForm}
              mutator={function (row: any, value: any) {
                valueSetter(
                  { data: row, newValue: value },
                  year,
                  isAfterMaxYear,
                  'value_mt',
                )
              }}
            />
          )
        },
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) =>
          valueGetter(params, year, isAfterMaxYear, 'value_mt'),
        valueSetter: (params: any) =>
          valueSetter(params, year, isAfterMaxYear, 'value_mt'),
        wrapText: true,
      })

      valuesCO2.push({
        autoHeaderHeight: true,
        cellClass: 'ag-text-center',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          allowNullVals: true,
        },
        cellRendererParams: () => ({
          tooltipClassName: 'bp-table-tooltip',
        }),
        dataType: 'number',
        field: `value_co2_${year}`,
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              label={props.displayName}
              setForm={setForm}
              mutator={function (row: any, value: any) {
                valueSetter(
                  { data: row, newValue: value },
                  year,
                  isAfterMaxYear,
                  'value_co2',
                )
              }}
            />
          )
        },
        headerName: `${label}`,
        minWidth: 80,
        valueGetter: (params: any) =>
          valueGetter(params, year, isAfterMaxYear, 'value_co2'),
        valueSetter: (params: any) =>
          valueSetter(params, year, isAfterMaxYear, 'value_co2'),
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
      {
        children: valuesCO2,
        headerName: 'CO2-EQ',
        headerGroupComponent: () => (
          <span>
            CO<sub>2</sub>-EQ
          </span>
        ),
      },
    ]
  }, [yearRangeSelected, valueGetter, valueSetter, setForm])

  const addActivity = () => {
    setForm([
      {
        lvc_status: 'Undefined',
        row_id: form.length + 1,
        values: [],
      } as any,
      ...form,
    ])
  }

  const onRemoveActivity = (props: any) => {
    const removedActivity = props.data
    const newData = [...form]

    const index = findIndex(
      newData,
      (row: any) => row.row_id === removedActivity.row_id,
    )

    if (index > -1) {
      newData.splice(index, 1)
      setForm(newData)

      applyTransaction(grid.current.api, {
        remove: [removedActivity],
      })
    }
  }

  const columnOptions = useColumnsOptions(
    yearColumns,
    onRemoveActivity,
    form,
    setForm,
    isConsolidatedView,
  )

  const AddActivityButton = () => (
    <div className="bp-table-toolbar mb-4 flex">
      <div className="ml-auto flex">
        <Button
          className="border border-solid border-primary bg-white px-3 py-1 normal-case text-primary shadow-none"
          size="large"
          variant="contained"
          onClick={addActivity}
        >
          Add activity <IoAddCircle className="ml-1.5" size={18} />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <form>
        <Table
          className="bp-edit-table"
          Toolbar={AddActivityButton}
          columnDefs={columnOptions.columnDefs}
          defaultColDef={columnOptions.defaultColDef}
          domLayout="normal"
          getRowId={(props) => props.data.row_id}
          gridRef={grid}
          loaded={!loading}
          loading={loading}
          resizeGridOnRowUpdate={true}
          rowData={form}
          singleClickEdit={true}
          suppressScrollOnNewData={true}
          tooltipShowDelay={200}
          onCellValueChanged={(event) => {
            const eventData = event.data
            const newData = [...form]

            const rowIndex = findIndex(
              newData,
              (row) => row.row_id === eventData.row_id,
            )

            if (rowIndex > -1) {
              newData.splice(rowIndex, 1, {
                ...eventData,
              })

              setForm(newData)
            }
          }}
        />
      </form>
    </>
  )
}

export default function BPEditTable(props: BPEditTableInterface) {
  const { period } = useParams<BpPathParams>()
  const year_start = period.split('-')[0]

  const { yearRanges } = useContext(BPYearRangesContext)

  const yearRangeSelected = useMemo(
    () => yearRanges.find((item) => item.year_start.toString() === year_start),
    [yearRanges, year_start],
  )

  return yearRangeSelected ? (
    <BPEditBaseTable yearRangeSelected={yearRangeSelected} {...props} />
  ) : null
}
