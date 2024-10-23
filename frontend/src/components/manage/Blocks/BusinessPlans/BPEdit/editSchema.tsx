import { useMemo } from 'react'

import { isNull } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { useStore } from '@ors/store'

import { tagsCellRenderer } from '../../Table/BusinessPlansTable/schemaHelpers'
import {
  multiYearFilterOptions,
  statusOptions,
  tableColumns,
} from '../constants'
import { useGetChemicalTypes } from '../useGetChemicalTypes'
import {
  MYAValueSetter,
  agFormatNameValue,
  agFormatValue,
  agFormatValueTags,
  commentsValueSetter,
  editTagsCellRenderer,
  getOptionLabel,
  getOptionLabelByName,
  isOptionEqualToValue,
  isOptionEqualToValueByName,
  statusValueSetter,
  substancesValueSetter,
  valueSetter,
} from './editSchemaHelpers'

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
  const statuses = statusOptions.map((status) => ({
    id: status.status,
    name: status.status_displayed,
  }))
  const commentTypes = bpSlice.commentTypes.data
  const chemicalTypes = useGetChemicalTypes()
  const chemicalTypesResults = chemicalTypes.results

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
          headerName: tableColumns.country_id,
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
          headerName: tableColumns.project_cluster_id,
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
          headerName: tableColumns.project_type_id,
          minWidth: 120,
          tooltipField: 'project_type.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'project_type', types),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select chemical type' },
            agFormatValue,
            getOptionLabel: (option: any) =>
              getOptionLabel(chemicalTypesResults, option),
            isOptionEqualToValue,
            options: chemicalTypesResults,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer
              {...props}
              value={props.data.bp_chemical_type?.name}
            />
          ),
          field: 'bp_chemical_type_id',
          headerClass: 'ag-text-center',
          headerName: tableColumns.bp_chemical_type_id,
          minWidth: 120,
          tooltipField: 'bp_chemical_type.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'bp_chemical_type', chemicalTypesResults),
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
          headerName: tableColumns.sector_id,
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
          headerName: tableColumns.subsector_id,
          minWidth: 120,
          tooltipField: 'subsector.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'subsector', subsectors),
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'title',
          headerClass: 'ag-text-center',
          headerName: tableColumns.title,
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
          headerName: tableColumns.substances,
          minWidth: 230,
          valueSetter: (params: any) =>
            substancesValueSetter(params, substances),
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'required_by_model',
          headerClass: 'ag-text-center',
          headerName: tableColumns.required_by_model,
          minWidth: 150,
          suppressAutoSize: true,
          tooltipField: 'required_by_model',
        },
        {
          cellClass: 'ag-text-center',
          cellEditor: 'agNumberCellEditor',
          cellEditorParams: {
            allowNullVals: true,
          },
          field: 'amount_polyol',
          headerClass: 'ag-text-center',
          headerName: tableColumns.amount_polyol,
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
            <AgCellRenderer {...props} value={props.data.status} />
          ),
          field: 'status',
          headerClass: 'ag-text-center',
          headerName: tableColumns.status,
          minWidth: 120,
          tooltipField: 'status_display',
          valueSetter: (params: any) => statusValueSetter(params, statuses),
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
          headerName: tableColumns.is_multi_year,
          minWidth: 120,
          tooltipField: 'is_multi_year_display',
          valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
          valueSetter: (params: any) =>
            MYAValueSetter(params, multiYearFilterOptions),
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'reason_for_exceeding',
          headerClass: 'ag-text-center',
          headerName: tableColumns.reason_for_exceeding,
          minWidth: 200,
          suppressAutoSize: true,
          tooltipField: 'reason_for_exceeding',
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'remarks',
          headerClass: 'ag-text-center',
          headerName: tableColumns.remarks,
          minWidth: 200,
          suppressAutoSize: true,
          tooltipField: 'remarks',
        },
        {
          cellClass: 'ag-cell-wrap-text',
          field: 'comment_secretariat',
          headerClass: 'ag-text-center',
          headerName: tableColumns.comment_secretariat,
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
            isOptionEqualToValue: isOptionEqualToValue,
            options: commentTypes,
          },
          cellRenderer: (props: any) =>
            editTagsCellRenderer({
              commentTypes,
              value: props.data.comment_types,
            }),
          field: 'comment_types',
          headerClass: 'ag-text-center',
          headerName: tableColumns.comment_types,
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
      chemicalTypesResults,
      sectors,
      subsectors,
      substances,
      statuses,
      commentTypes,
      yearColumns,
    ],
  )

  return colsOptions
}

export default useColumnsOptions
