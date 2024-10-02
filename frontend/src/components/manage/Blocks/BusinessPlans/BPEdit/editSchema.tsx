import { useCallback, useMemo } from 'react'

import { find, get, isNull, isObject } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { useStore } from '@ors/store'

import { tagsCellRenderer } from '../../Table/BusinessPlansTable/schemaHelpers'

const useColumnsOptions = (yearColumns: any[]) => {
  const projectSlice = useStore((state) => state.projects)

  const agFormatValue = (value: any) => value?.id || ''

  const valueSetter = useCallback(
    (params: any, colIdentifier: string, data: any) => {
      const newVal = params.newValue

      const currentDataObj = find(data, {
        id: newVal,
      })

      params.data[colIdentifier + '_id'] = newVal
      if (['sector'].includes(colIdentifier)) {
        params.data[colIdentifier + '_code'] = currentDataObj?.code
      }
      params.data[colIdentifier] = currentDataObj

      return true
    },
    [],
  )

  const colsOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: 'ag-text-center ag-cell-wrap-text ag-country-cell-text',
          field: 'country.name',
          headerClass: 'ag-text-center',
          headerName: 'Country',
          minWidth: 150,
          tooltipField: 'country.name',
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          field: 'project_cluster.code',
          headerClass: 'ag-text-center',
          headerName: 'Cluster',
          minWidth: 70,
          tooltipField: 'project_cluster.name',
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          field: 'project_type.code',
          headerClass: 'ag-text-center',
          headerName: 'Type',
          minWidth: 70,
          tooltipField: 'project_type.name',
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          field: 'bp_chemical_type.name',
          headerClass: 'ag-text-center',
          headerName: 'Chemical type',
          minWidth: 100,
          tooltipField: 'bp_chemical_type.name',
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select sector' },
            agFormatValue,
            getFormattedValue: (id: any) => {
              return find(projectSlice.sectors.data, {
                id,
              })?.name
            },
            getOptionLabel: (option: any) => {
              return isObject(option)
                ? get(option, 'name')
                : find(projectSlice.sectors.data, { id: option })?.name || ''
            },
            options: projectSlice.sectors.data,
          },
          cellRenderer: (props: any) => {
            return <AgCellRenderer {...props} value={props.data.sector.code} />
          },
          field: 'sector_id',
          headerClass: 'ag-text-center',
          headerName: 'Sector',
          minWidth: 120,
          tooltipField: 'sector.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'sector', projectSlice.sectors.data),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          field: 'subsector.code',
          headerClass: 'ag-text-center',
          headerName: 'Subsector',
          minWidth: 100,
          tooltipField: 'subsector.name',
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'title',
          headerClass: 'ag-text-center',
          headerName: 'Title',
          minWidth: 200,
          suppressAutoSize: true,
          tooltipField: 'title',
          valueSetter: (params: any) => {
            params.data.title = params.newValue ?? '-'
            return true
          },
        },
        {
          cellClass: 'ag-substances-cell-content',
          cellRenderer: tagsCellRenderer,
          field: 'substances_display',
          headerClass: 'ag-text-center',
          headerName: 'Substances',
          minWidth: 230,
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'required_by_model',
          headerClass: 'ag-text-center',
          headerName: 'Required by model',
          minWidth: 150,
          suppressAutoSize: true,
          tooltipField: 'required_by_model',
        },
        {
          cellClass: 'ag-text-center',
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            allowNullVals: true,
            min: 0,
          },
          field: 'amount_polyol',
          headerClass: 'ag-text-center',
          headerName: 'Polyol Amount',
          minWidth: 100,
          valueGetter: (params: any) => {
            const polyolAmount = params.data.amount_polyol

            return !isNull(polyolAmount)
              ? parseFloat(polyolAmount).toFixed(2)
              : null
          },
          wrapText: true,
        },
        ...yearColumns,
        {
          cellClass: 'ag-text-center',
          field: 'status',
          headerClass: 'ag-text-center',
          headerName: 'Status',
          minWidth: 100,
          tooltipField: 'status_display',
        },
        {
          cellClass: 'ag-text-center',
          field: 'is_multi_year',
          headerClass: 'ag-text-center',
          headerName: 'IND/MYA',
          minWidth: 100,
          tooltipField: 'is_multi_year_display',
          valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'reason_for_exceeding',
          headerClass: 'ag-text-center',
          headerName: 'Reason for Exceeding',
          minWidth: 200,
          suppressAutoSize: true,
          tooltipField: 'reason_for_exceeding',
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'remarks',
          headerClass: 'ag-text-center',
          headerName: 'Remarks',
          minWidth: 200,
          suppressAutoSize: true,
          tooltipField: 'remarks',
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'comment_secretariat',
          headerClass: 'ag-text-center',
          headerName: 'Comment',
          minWidth: 200,
          suppressAutoSize: true,
          tooltipField: 'comment_secretariat',
        },
        {
          cellRenderer: tagsCellRenderer,
          field: 'comment_types',
          headerClass: 'ag-text-center',
          headerName: 'Tags',
          minWidth: 230,
        },
      ],
      defaultColDef: {
        autoHeight: true,
        editable: true,
        resizable: true,
      },
    }),
    [projectSlice, yearColumns, valueSetter],
  )

  return colsOptions
}

export default useColumnsOptions
