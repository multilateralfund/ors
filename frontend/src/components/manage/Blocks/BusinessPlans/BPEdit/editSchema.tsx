import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { filter, isNil } from 'lodash'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { useStore } from '@ors/store'

import { EditTagsCellRenderer } from '../BPTableHelpers/cellRenderers'
import { multiYearFilterOptions, tableColumns } from '../constants'
import { useGetChemicalTypes } from '../useGetChemicalTypes'
import {
  MYAValueSetter,
  agFormatNameValue,
  agFormatValue,
  agFormatValueTags,
  commentsValueSetter,
  getOptionLabel,
  getOptions,
  isOptionEqualToValue,
  isOptionEqualToValueByName,
  statusValueSetter,
  substancesValueSetter,
  valueSetter,
} from './editSchemaHelpers'

import { IoTrash } from 'react-icons/io5'

const useColumnsOptions = (
  yearColumns: any[],
  onRemoveActivity: (props: any) => void,
  form: Array<ApiEditBPActivity>,
  setForm: Dispatch<SetStateAction<ApiEditBPActivity[] | null | undefined>>,
) => {
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
  const statuses =
    commonSlice.settings.data.business_plan_activity_statuses.map((status) => ({
      id: status[0],
      name: status[1],
    }))

  const commentTypes = bpSlice.commentTypes.data
  const chemicalTypes = useGetChemicalTypes()
  const chemicalTypesResults = chemicalTypes.results

  const getSubsectorsOfSector = useCallback(
    (params: any) =>
      filter(
        subsectors,
        (subsector) => subsector.sector_id === params.data.sector_id,
      ),
    [subsectors],
  )

  const colsOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellRenderer: (props: any) => (
            <IoTrash
              className="cursor-pointer fill-gray-400"
              size={16}
              onClick={() => {
                onRemoveActivity(props)
              }}
            />
          ),
          editable: false,
          field: '',
          minWidth: 20,
        },
        {
          cellClass: 'ag-text-center ag-cell-centered ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select country' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(countries, option),
            isOptionEqualToValue,
            openOnFocus: true,
            options: countries,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.country?.name} />
          ),
          field: 'country_id',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
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
            openOnFocus: true,
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
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
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
            openOnFocus: true,
            options: types,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.project_type?.code} />
          ),
          field: 'project_type_id',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
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
            openOnFocus: true,
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
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
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
            openOnFocus: true,
            options: sectors,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.sector?.code} />
          ),
          field: 'sector_id',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
          headerName: tableColumns.sector_id,
          minWidth: 120,
          tooltipField: 'sector.name',
          valueSetter: (params: any) =>
            valueSetter(
              params,
              'sector',
              sectors,
              getSubsectorsOfSector(params),
            ),
        },
        {
          cellClass: 'ag-text-center ag-cell-wrap-text',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const subsectorsOfSector = getSubsectorsOfSector(params)

            return {
              Input: { placeholder: 'Select subsector' },
              agFormatValue,
              getOptionLabel: (option: any) =>
                getOptionLabel(subsectorsOfSector, option),
              isOptionEqualToValue,
              openOnFocus: true,
              options: subsectorsOfSector,
            }
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.subsector?.code} />
          ),
          field: 'subsector_id',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
          headerName: tableColumns.subsector_id,
          minWidth: 120,
          tooltipField: 'subsector.name',
          valueSetter: (params: any) =>
            valueSetter(params, 'subsector', getSubsectorsOfSector(params)),
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'title',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
          headerName: tableColumns.title,
          minWidth: 200,
          tooltipField: 'title',
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: {
              placeholder: 'Select substances',
            },
            agFormatValue: agFormatValueTags,
            getOptionLabel: (option: any) => getOptionLabel(substances, option),
            getOptions: (value: any) => getOptions(value, substances),
            isMultiple: true,
            isOptionEqualToValue,
            openOnFocus: true,
            showUnselectedOptions: true,
          },
          cellRenderer: (props: any) =>
            EditTagsCellRenderer({
              ...{ form, props, setForm },
              field: 'substances',
              options: substances,
            }),
          field: 'substances',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
          headerName: tableColumns.substances,
          minWidth: 230,
          valueSetter: (params: any) =>
            substancesValueSetter(params, substances),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          field: 'required_by_model',
          headerClass: 'ag-text-center',
          headerName: tableColumns.required_by_model,
          minWidth: 150,
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

            return !isNil(polyolAmount)
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
            openOnFocus: true,
            options: statuses,
          },
          cellRenderer: (props: any) => (
            <AgCellRenderer {...props} value={props.data.status} />
          ),
          field: 'status',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
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
              getOptionLabel(multiYearFilterOptions, option, 'name'),
            isOptionEqualToValue: isOptionEqualToValueByName,
            openOnFocus: true,
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
          cellClass: 'ag-cell-ellipsed',
          field: 'reason_for_exceeding',
          headerClass: 'ag-text-center',
          headerName: tableColumns.reason_for_exceeding,
          minWidth: 200,
          tooltipField: 'reason_for_exceeding',
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'remarks',
          headerClass: 'ag-text-center',
          headerName: tableColumns.remarks,
          minWidth: 200,
          tooltipField: 'remarks',
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'comment_secretariat',
          headerClass: 'ag-text-center',
          headerName: tableColumns.comment_secretariat,
          minWidth: 200,
          tooltipField: 'comment_secretariat',
          valueSetter: (params: any) => {
            params.data.comment_secretariat = params.newValue ?? ''
            return true
          },
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
            getOptions: (value: any) => getOptions(value, commentTypes),
            isMultiple: true,
            isOptionEqualToValue: isOptionEqualToValue,
            openOnFocus: true,
            showUnselectedOptions: true,
          },
          cellRenderer: (props: any) =>
            EditTagsCellRenderer({
              ...{ form, props, setForm },
              field: 'comment_types',
              options: commentTypes,
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
        enableCellChangeFlash: false,
        resizable: true,
      },
    }),
    [
      countries,
      clusters,
      form,
      setForm,
      types,
      getSubsectorsOfSector,
      chemicalTypesResults,
      sectors,
      substances,
      statuses,
      commentTypes,
      yearColumns,
      onRemoveActivity,
    ],
  )

  return colsOptions
}

export default useColumnsOptions
