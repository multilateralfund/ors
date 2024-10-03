import { useCallback, useMemo } from 'react'

import { find, get, isEqual, isNull, isObject } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { useStore } from '@ors/store'

import { tagsCellRenderer } from '../../Table/BusinessPlansTable/schemaHelpers'

const useColumnsOptions = (yearColumns: any[]) => {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const cpReportsSlice = useStore((state) => state.cp_reports)
  const bpSlice = useStore((state) => state.businessPlans)

  const agFormatValue = (value: any) => value?.id || ''
  const agFormatValueTags = (value: any) => (value?.length > 0 ? value : '')

  const isOptionEqualToValue = (option: any, value: any) =>
    isObject(value) ? isEqual(option, value) : option.id === value

  const isOptionEqualToValueComments = (option: any, value: any) =>
    isObject(value) ? isEqual(option, value) : option.name === value

  const valueSetter = useCallback(
    (params: any, colIdentifier: string, data: any) => {
      const newVal = params.newValue

      const currentDataObj = find(data, {
        id: newVal,
      })

      params.data[colIdentifier + '_id'] = newVal
      if (['project_type', 'sector'].includes(colIdentifier)) {
        params.data[colIdentifier + '_code'] = currentDataObj?.code
      }
      params.data[colIdentifier] = currentDataObj

      return true
    },
    [],
  )

  const substancesValueSetter = useCallback(
    (params: any) => {
      const newValIds = params.newValue?.map((newVal: any) =>
        isObject(newVal) ? get(newVal, 'id') : newVal,
      )
      params.data.substances = newValIds

      params.data.substances_display = newValIds?.map(
        (id: number) =>
          find(cpReportsSlice.substances.data, {
            id,
          })?.name,
      )

      return true
    },
    [cpReportsSlice.substances.data],
  )

  const commentsValueSetter = useCallback((params: any) => {
    const newValNames = params.newValue?.map((newVal: any) =>
      isObject(newVal) ? get(newVal, 'name') : newVal,
    )
    params.data.comment_types = newValNames

    return true
  }, [])

  const getFormattedValue = (data: any, id: number) => find(data, { id })?.name

  const getOptionLabel = (data: any, option: any) =>
    isObject(option)
      ? get(option, 'name')
      : find(data, { id: option })?.name || ''

  const colsOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: 'ag-text-center ag-cell-wrap-text ag-country-cell-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select country' },
            agFormatValue,
            getFormattedValue: (id: number) =>
              getFormattedValue(commonSlice.countries.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(commonSlice.countries.data, option),
            isOptionEqualToValue,
            options: commonSlice.countries.data,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.country?.name} />
          ),
          field: 'country_id',
          headerClass: 'ag-text-center',
          headerName: 'Country',
          minWidth: 150,
          tooltipField: 'country.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'country', commonSlice.countries.data),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select cluster' },
            agFormatValue,
            getFormattedValue: (id: any) =>
              getFormattedValue(projectSlice.clusters.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(projectSlice.clusters.data, option),
            isOptionEqualToValue,
            options: projectSlice.clusters.data,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer
              {...props}
              value={props.data.project_cluster?.code}
            />
          ),
          field: 'project_cluster_id',
          headerClass: 'ag-text-center',
          headerName: 'Cluster',
          minWidth: 120,
          tooltipField: 'project_cluster.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'project_cluster', projectSlice.clusters.data),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select type' },
            agFormatValue,
            getFormattedValue: (id: any) =>
              getFormattedValue(bpSlice.types.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(bpSlice.types.data, option),
            isOptionEqualToValue,
            options: bpSlice.types.data,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.project_type?.code} />
          ),
          field: 'project_type_id',
          headerClass: 'ag-text-center',
          headerName: 'Type',
          minWidth: 120,
          tooltipField: 'project_type.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'project_type', bpSlice.types.data),
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
            getFormattedValue: (id: any) =>
              getFormattedValue(bpSlice.sectors.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(bpSlice.sectors.data, option),
            isOptionEqualToValue,
            options: bpSlice.sectors.data,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.sector?.code} />
          ),
          field: 'sector_id',
          headerClass: 'ag-text-center',
          headerName: 'Sector',
          minWidth: 120,
          tooltipField: 'sector.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'sector', bpSlice.sectors.data),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select subsector' },
            agFormatValue,
            getFormattedValue: (id: any) =>
              getFormattedValue(bpSlice.subsectors.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(bpSlice.subsectors.data, option),
            isOptionEqualToValue,
            options: bpSlice.subsectors.data,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.subsector?.code} />
          ),
          field: 'subsector_id',
          headerClass: 'ag-text-center',
          headerName: 'Subsector',
          minWidth: 120,
          tooltipField: 'subsector.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'subsector', bpSlice.subsectors.data),
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
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: {
              placeholder: 'Select substances',
            },
            agFormatValue: (value: any) => agFormatValueTags(value),
            getFormattedValue: (id: any) =>
              getFormattedValue(cpReportsSlice.substances.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(cpReportsSlice.substances.data, option),
            isMultiple: true,
            isOptionEqualToValue,
            options: cpReportsSlice.substances.data,
          },
          cellRenderer: (props: any) =>
            tagsCellRenderer({ value: props.data.substances_display }),
          field: 'substances',
          headerClass: 'ag-text-center',
          headerName: 'Substances',
          minWidth: 230,
          valueSetter: (params: any) => substancesValueSetter(params),
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
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: {
              placeholder: 'Select comment type',
            },
            agFormatValue: (value: any) => agFormatValueTags(value),
            getFormattedValue: (id: any) =>
              getFormattedValue(bpSlice.commentTypes.data, id),
            getOptionLabel: (option: any) =>
              getOptionLabel(bpSlice.commentTypes.data, option),
            isMultiple: true,
            isOptionEqualToValue: isOptionEqualToValueComments,
            options: bpSlice.commentTypes.data,
          },
          cellRenderer: (props: any) =>
            tagsCellRenderer({ value: props.data.comment_types }),
          field: 'comment_types',
          headerClass: 'ag-text-center',
          headerName: 'Comment types',
          minWidth: 230,
          valueSetter: (params: any) => commentsValueSetter(params),
        },
      ],
      defaultColDef: {
        autoHeight: true,
        editable: true,
        resizable: true,
      },
    }),
    [
      commonSlice,
      projectSlice,
      cpReportsSlice,
      bpSlice,
      yearColumns,
      valueSetter,
      substancesValueSetter,
      commentsValueSetter,
    ],
  )

  return colsOptions
}

export default useColumnsOptions
