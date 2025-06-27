'use client'
import { useCallback, useContext, useMemo, useRef, useState } from 'react'

import EditTable from '@ors/components/manage/Form/EditTable'
import {
  BPEditTableInterface,
  BpPathParams,
} from '@ors/components/manage/Blocks/BusinessPlans/types'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import BPDeleteActivityWarning from './BPDeleteActivityWarning'
import BPResetFieldsWarning from './BPResetFieldsWarning'
import { editCellRenderer } from '../BPTableHelpers/cellRenderers'
import { emptyFieldData, updateFieldData } from './editSchemaHelpers'
import useColumnsOptions from './editSchema'
import { ApiBPYearRange } from '@ors/types/api_bp_get_years'
import { api, applyTransaction } from '@ors/helpers'
import { useStore } from '@ors/store'

import { find, findIndex, isNil, map, uniq } from 'lodash'
import { Button, Alert } from '@mui/material'
import { useParams } from 'wouter'
import {
  IoAddCircle,
  IoInformationCircleOutline,
  IoClipboardOutline,
} from 'react-icons/io5'
import { BasePasteWrapper } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport/BasePasteWrapper.tsx'

export type PendingEditType = null | {
  field: string
  newValue: number
  rowId: number
  isOtherValue: boolean
}

export function BPEditBaseTable(
  props: { yearRangeSelected: ApiBPYearRange } & BPEditTableInterface,
) {
  const {
    form = [],
    isConsolidatedView = false,
    loading,
    setForm,
    yearRangeSelected,
    chemicalTypes,
    isDataFormatted,
    results,
    activitiesRef,
  } = props

  const grid = useRef<any>()

  const bpSlice = useStore((state) => state.businessPlans)
  const projectSlice = useStore((state) => state.projects)

  const clusters = projectSlice.clusters.data
  const types = bpSlice.types.data
  const sectors = bpSlice.sectors.data
  const subsectors = bpSlice.subsectors.data

  const [deleteErrors, setDeleteErrors] = useState<string[]>([])
  const [activityToDelete, setActivityToDelete] = useState<Record<
    string,
    any
  > | null>(null)

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

      if (value && !isNil(value[colIdentifier]) && value[colIdentifier] > 0) {
        return parseFloat(value[colIdentifier])
      }

      return 0
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
      const newVal = params.newValue > 0 ? params.newValue : 0

      if (value) {
        value[colIdentifier] = newVal
      } else {
        const newValueObj = {
          [colIdentifier]: newVal,
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
        field: `value_usd_${isAfterMaxYear ? `${yearRangeSelected.year_end}_after` : year}`,
        cellRenderer: (props: any) => {
          const value = valueGetter(props, year, isAfterMaxYear, 'value_usd')
          return editCellRenderer(props, value?.toString() || '')
        },
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              form={form}
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
        minWidth: 90,
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
        field: `value_odp_${isAfterMaxYear ? `${yearRangeSelected.year_end}_after` : year}`,
        cellRenderer: (props: any) => {
          const value = valueGetter(props, year, isAfterMaxYear, 'value_odp')
          return editCellRenderer(props, value?.toString() || '')
        },
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              form={form}
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
        minWidth: 90,
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
        field: `value_mt_${isAfterMaxYear ? `${yearRangeSelected.year_end}_after` : year}`,
        cellRenderer: (props: any) => {
          const value = valueGetter(props, year, isAfterMaxYear, 'value_mt')
          return editCellRenderer(props, value?.toString() || '')
        },
        headerClass: 'ag-text-center',
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              form={form}
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
        minWidth: 90,
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
        field: `value_co2_${isAfterMaxYear ? `${yearRangeSelected.year_end}_after` : year}`,
        headerClass: 'ag-text-center',
        cellRenderer: (props: any) => {
          const value = valueGetter(props, year, isAfterMaxYear, 'value_co2')
          return editCellRenderer(props, value?.toString() || '')
        },
        headerComponent: function (props: any) {
          return (
            <BasePasteWrapper
              form={form}
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
        minWidth: 90,
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
        headerName: 'Value ($000) adjusted',
      },
      {
        children: valuesODP,
        headerName: 'ODP adjusted',
      },
      {
        children: valuesMT,
        headerName: 'MT for HFC adjusted',
      },
      {
        children: valuesCO2,
        headerName: 'CO2-EQ',
        headerGroupComponent: () => (
          <span>
            CO<sub>2</sub>-EQ adjusted
          </span>
        ),
      },
    ]
  }, [yearRangeSelected, valueGetter, valueSetter, setForm])

  const addActivity = () => {
    setForm([
      {
        lvc_status: '',
        bp_chemical_type_id: null,
        project_cluster_id: null,
        project_type_code: '',
        project_type_id: null,
        sector_code: '',
        sector_id: null,
        status: '',
        subsector_id: null,
        title: '',
        substances: [],
        row_id: form.length,
        values: [],
      } as any,
      ...form,
    ])
  }

  const validateActivity = async (id: number) => {
    try {
      const url = `/api/business-plan-activity/${id}/validate_for_removal/`

      const res = await api(
        url,
        {
          withStoreCache: false,
        },
        false,
      )

      setDeleteErrors(res)

      return res.length === 0
    } catch (error: any) {
      console.error('Error:', error)
    }
  }

  const onRemoveActivity = async (props: any) => {
    const removedActivity = props.data

    let isDeletionValid = true
    if (removedActivity?.id) {
      isDeletionValid = (await validateActivity(removedActivity.id)) as boolean
    }

    if (isDeletionValid) {
      handleRemoveActivity(removedActivity)
    } else {
      setActivityToDelete(removedActivity)
    }
  }

  const handleRemoveActivity = (activity: any) => {
    const crtActivity = activity ?? activityToDelete

    if (crtActivity) {
      const newData = [...form]

      const index = findIndex(
        newData,
        (row: any) => row.row_id === crtActivity.row_id,
      )

      if (index > -1) {
        newData.splice(index, 1)

        const formattedData = map(newData, (dataItem, index) => ({
          ...dataItem,
          row_id: newData.length - index - 1,
        }))

        setForm(formattedData)
        applyTransaction(grid.current.api, {
          remove: [crtActivity],
        })
      }
    }
  }

  const [pendingEdit, setPendingEdit] = useState<PendingEditType>(null)

  const columnOptions = useColumnsOptions(
    yearColumns,
    onRemoveActivity,
    form,
    setForm,
    chemicalTypes,
    activitiesRef,
    setPendingEdit,
    isConsolidatedView,
  )

  const InfoBox = () => (
    <Alert
      className="flex-1 bg-mlfs-bannerColor"
      icon={<IoInformationCircleOutline size={24} />}
      severity="info"
    >
      <ul className="mt-0.5 list-inside space-y-1 pl-0">
        <li>
          Use this page to edit individual activities of this Business Plan by
          clicking on the desired cell and choosing one of the permitted values
          or typing text or numbers in the appropriate fields.
        </li>
        <li>
          When adding a cluster, type, sector or subsector which is not in the
          list, the value will be converted to 'Other'. Please ensure you
          mention the value in the Remarks field.
        </li>
        <li>
          By default, the activities listed below are sorted alphabetically.
          However, newly added or edited activities will temporarily appear at
          the top of the list until the page is refreshed or navigated away
          from.
        </li>
        <li>
          Columns containing the{' '}
          <span className="inline-flex align-middle">
            <IoClipboardOutline />
          </span>{' '}
          icon allow pasting of values onto multiple rows when these values have
          been copied from an Excel file downloaded from this system. Follow
          these steps to do this:
          <ol className="mt-1 space-y-1 pl-4">
            <li>
              In the Excel file, select the desired cells from the first column
              (Activity ID), and while holding down the CTRL key, continue
              selecting the corresponding cells from the target column where you
              intend to paste the data (e.g. Required by model).
            </li>
            <li>
              Return to this screen and click the{' '}
              <span className="inline-flex align-middle">
                <IoClipboardOutline />
              </span>{' '}
              icon from the desired header column (e.g. Required by model). The
              system will paste the values in the correct activities, regardless
              of how the Excel rows were sorted.
            </li>
          </ol>
        </li>
      </ul>
    </Alert>
  )

  const AddActivityButton = () => (
    <div className="bp-table-toolbar mb-4 flex">
      <div className="ml-auto flex">
        <Button
          className="h-fit border border-solid border-primary bg-white px-3 py-1 normal-case text-primary shadow-none"
          size="large"
          variant="contained"
          onClick={addActivity}
        >
          Add activity <IoAddCircle className="ml-1.5" size={18} />
        </Button>
      </div>
    </div>
  )

  const TableToolbar = () => (
    <div className="flex justify-between gap-2.5">
      <InfoBox />
      <AddActivityButton />
    </div>
  )

  const rowClassRules = {
    'edited-activity': (props: any) =>
      activitiesRef.current.all.includes(props.data.initial_id),
  }

  const getUpdatedFieldData = (data: any) => {
    if (pendingEdit) {
      const optionsFieldMapping = {
        project_cluster: clusters,
        project_type: types,
        sector: sectors,
        ...(pendingEdit.isOtherValue && { subsector: subsectors }),
      }

      const field = pendingEdit.field
      const options =
        optionsFieldMapping[field as keyof typeof optionsFieldMapping]

      const resetFieldsMapping = {
        project_cluster: ['project_type', 'sector', 'subsector'],
        project_type: ['sector', 'subsector'],
        sector: ['subsector'],
      }

      const valueForUpdate = pendingEdit.isOtherValue
        ? find(options, (option) => option.name === 'Other')?.id
        : pendingEdit.newValue

      updateFieldData(options, data, field, valueForUpdate)
      resetFieldsMapping[field as keyof typeof resetFieldsMapping]?.forEach(
        (field) => emptyFieldData(data, field),
      )

      return data
    }
  }

  const changeCellValue = (data: any, rowIndex: number) => {
    const newData = [...form]

    if (rowIndex > -1) {
      newData.splice(rowIndex, 1, {
        ...data,
      })

      setForm(newData)

      activitiesRef.current.edited = uniq([
        data.initial_id,
        ...(activitiesRef.current.edited || []),
      ]).filter(Boolean)
    }
  }

  const updateFields = () => {
    if (pendingEdit && form && form.length > 0) {
      const rowIndex = form.length - pendingEdit.rowId - 1

      const data = getUpdatedFieldData(form[rowIndex])
      changeCellValue(data, rowIndex)
    }
  }

  return (
    <>
      <form>
        <EditTable
          className="bp-edit-table"
          Toolbar={TableToolbar}
          columnDefs={columnOptions.columnDefs}
          defaultColDef={columnOptions.defaultColDef}
          domLayout="normal"
          getRowId={(props) => props.data.row_id}
          gridRef={grid}
          loaded={!loading}
          loading={loading}
          resizeGridOnRowUpdate={true}
          rowClassRules={rowClassRules}
          rowData={form}
          singleClickEdit={true}
          suppressScrollOnNewData={true}
          results={results}
          isDataFormatted={isDataFormatted}
          tooltipShowDelay={200}
          onCellValueChanged={(event) => {
            const eventData = event.data
            const newData = [...form]
            const rowIndex = findIndex(
              newData,
              (row) => row.row_id === eventData.row_id,
            )

            changeCellValue(eventData, rowIndex)
          }}
        />
      </form>
      {pendingEdit && (
        <BPResetFieldsWarning
          {...{ pendingEdit, setPendingEdit, updateFields }}
        />
      )}
      <BPDeleteActivityWarning
        activityId={activityToDelete?.display_internal_id}
        {...{ deleteErrors, setDeleteErrors, handleRemoveActivity }}
      />
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
