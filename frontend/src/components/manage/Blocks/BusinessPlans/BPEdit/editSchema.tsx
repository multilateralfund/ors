import { useCallback, useMemo } from 'react'

import { find, get, isEqual, isNull, isObject } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { useStore } from '@ors/store'

import { tagsCellRenderer } from '../../Table/BusinessPlansTable/schemaHelpers'
import { multiYearFilterOptions } from '../constants'

const useColumnsOptions = (yearColumns: any[]) => {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const cpReportsSlice = useStore((state) => state.cp_reports)
  const bpSlice = useStore((state) => state.businessPlans)

  const countries = commonSlice.countries.data
  const clusters = projectSlice.clusters.data
  const types = bpSlice.types.data
  const sectors = bpSlice.sectors.data
  const subsectors = bpSlice.subsectors.data
  const substances = cpReportsSlice.substances.data
  const statuses = commonSlice.settings.data.business_plan_statuses.map(
    (status) => ({
      id: status[0],
      name: status[1],
    }),
  )
  const commentTypes = bpSlice.commentTypes.data

  const agFormatValue = (value: any) => value?.id || ''
  const agFormatNameValue = (value: any) => value?.name || ''
  const agFormatValueTags = (value: any) => (value?.length > 0 ? value : '')

  const getOptionLabel = (data: any, option: any) =>
    isObject(option)
      ? get(option, 'name')
      : find(data, { id: option })?.name || ''

  const getOptionLabelByName = (data: any, option: any) =>
    isObject(option)
      ? get(option, 'name')
      : find(data, { name: option })?.name || ''

  const isOptionEqualToValue = (option: any, value: any) =>
    isObject(value) ? isEqual(option, value) : option.id === value

  const isOptionEqualToValueByName = (option: any, value: any) =>
    isObject(value) ? isEqual(option, value) : option.name === value

  const valueSetter = useCallback(
    (params: any, colIdentifier: string, data: any) => {
      const newVal = params.newValue

      const currentDataObj = find(data, {
        id: newVal,
      })

      params.data[colIdentifier + '_id'] = newVal //vezi

      if (['project_type', 'sector'].includes(colIdentifier)) {
        params.data[colIdentifier + '_code'] = currentDataObj?.code
      }
      if (colIdentifier === 'status') {
        params.data[colIdentifier + '_display'] = currentDataObj?.name
      }

      params.data[colIdentifier] = currentDataObj

      return true
    },
    [],
  )

  const MYAValueSetter = useCallback((params: any) => {
    const newVal = params.newValue

    const currentDataObj = find(multiYearFilterOptions, {
      name: newVal,
    })

    params.data.is_multi_year_display = currentDataObj?.fullName
    params.data.is_multi_year = currentDataObj?.id

    return true
  }, [])

  const substancesValueSetter = useCallback(
    (params: any) => {
      const newValIds = params.newValue?.map((newVal: any) =>
        isObject(newVal) ? get(newVal, 'id') : newVal,
      )

      params.data.substances = newValIds
      params.data.substances_display = newValIds?.map(
        (id: number) =>
          find(substances, {
            id,
          })?.name,
      )

      return true
    },
    [substances],
  )

  const commentsValueSetter = useCallback((params: any) => {
    const newValNames = params.newValue?.map((newVal: any) =>
      isObject(newVal) ? get(newVal, 'name') : newVal,
    )
    params.data.comment_types = newValNames

    return true
  }, [])

  const colsOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: 'ag-text-center ag-cell-wrap-text ag-country-cell-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select country' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(countries, option),
            isOptionEqualToValue,
            options: countries,
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
            valueSetter(params, 'country', countries),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select cluster' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(clusters, option),
            isOptionEqualToValue,
            options: clusters,
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
            valueSetter(params, 'project_cluster', clusters),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select type' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(types, option),
            isOptionEqualToValue,
            options: types,
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
            valueSetter(params, 'project_type', types),
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
            getOptionLabel: (option: any) => getOptionLabel(sectors, option),
            isOptionEqualToValue,
            options: sectors,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.sector?.code} />
          ),
          field: 'sector_id',
          headerClass: 'ag-text-center',
          headerName: 'Sector',
          minWidth: 120,
          tooltipField: 'sector.name',
          valueSetter: (params: any) => valueSetter(params, 'sector', sectors),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select subsector' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(subsectors, option),
            isOptionEqualToValue,
            options: subsectors,
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
            valueSetter(params, 'subsector', subsectors),
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
            agFormatValue: agFormatValueTags,
            getOptionLabel: (option: any) => getOptionLabel(substances, option),
            isMultiple: true,
            isOptionEqualToValue,
            options: substances,
          },
          cellRenderer: (props: any) =>
            tagsCellRenderer({ value: props.data.substances_display }),
          field: 'substances',
          headerClass: 'ag-text-center',
          headerName: 'Substances',
          minWidth: 230,
          valueSetter: substancesValueSetter,
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
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select status' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(statuses, option),
            isOptionEqualToValue,
            options: statuses,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.status_display} />
          ),
          field: 'status',
          headerClass: 'ag-text-center',
          headerName: 'Status',
          minWidth: 120,
          tooltipField: 'status_display',
          valueSetter: (params: any) => valueSetter(params, 'status', statuses),
        },
        {
          cellClass: 'ag-text-center',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select IND/MYA' },
            agFormatValue: agFormatNameValue,
            getOptionLabel: (option: any) =>
              getOptionLabelByName(multiYearFilterOptions, option),
            isOptionEqualToValue: isOptionEqualToValueByName,
            options: multiYearFilterOptions,
          },
          field: 'is_multi_year',
          headerClass: 'ag-text-center',
          headerName: 'IND/MYA',
          minWidth: 120,
          tooltipField: 'is_multi_year_display',
          valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
          valueSetter: MYAValueSetter,
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
            agFormatValue: agFormatValueTags,
            getOptionLabel: (option: any) =>
              getOptionLabel(commentTypes, option),
            isMultiple: true,
            isOptionEqualToValue: isOptionEqualToValueByName,
            options: commentTypes,
          },
          cellRenderer: (props: any) =>
            tagsCellRenderer({ value: props.data.comment_types }),
          field: 'comment_types',
          headerClass: 'ag-text-center',
          headerName: 'Comment types',
          minWidth: 230,
          valueSetter: commentsValueSetter,
        },
      ],
      defaultColDef: {
        autoHeight: true,
        editable: true,
        resizable: true,
      },
    }),
    [
      countries,
      clusters,
      types,
      sectors,
      subsectors,
      substances,
      statuses,
      commentTypes,
      MYAValueSetter,
      yearColumns,
      valueSetter,
      substancesValueSetter,
      commentsValueSetter,
    ],
  )

  return colsOptions
}

export default useColumnsOptions
