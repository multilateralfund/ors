import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { filter, isNil } from 'lodash'

import { useStore } from '@ors/store'

import {
  editCellRenderer,
  EditTagsCellRenderer,
} from '../BPTableHelpers/cellRenderers'
import { multiYearFilterOptions, tableColumns } from '../constants'
import {
  MYAValueSetter,
  agFormatNameValue,
  agFormatValue,
  agFormatValueTags,
  getOptionLabel,
  getOptions,
  isOptionEqualToValue,
  isOptionEqualToValueByName,
  statusValueSetter,
  substancesValueSetter,
  valueSetter,
} from './editSchemaHelpers'
import { HeaderPasteWrapper } from './pasteSupport'

import { IoTrash } from 'react-icons/io5'
import { ITooltipParams } from 'ag-grid-community'
import { hasErrors } from '../utils'
import { chemicalTypesType } from '../types'

const useColumnsOptions = (
  yearColumns: any[],
  onRemoveActivity: (props: any) => void,
  form: Array<ApiEditBPActivity>,
  setForm: Dispatch<SetStateAction<ApiEditBPActivity[] | null | undefined>>,
  chemicalTypes: chemicalTypesType,
  isConsolidatedView?: boolean,
) => {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const cpReportsSlice = useStore((state) => state.cp_reports)
  const bpSlice = useStore((state) => state.businessPlans)

  const countries = commonSlice.countries.data
  const agencies = commonSlice.agencies.data
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
  const chemicalTypesResults = chemicalTypes.results
  const { rowErrors } = useStore((state) => state.bpErrors)

  const getSectorOfProjectType = useCallback(
    (params: any) =>
      filter(sectors, (sector) => {
        return (
          !params.data.project_type?.id ||
          params.data.project_type.allowed_sectors.includes(sector.id)
        )
      }),
    [sectors],
  )

  const getProjectTypeOfSector = useCallback(
    (params: any) =>
      filter(types, (type) => {
        return (
          !params.data.sector?.id ||
          params.data.sector.allowed_types.includes(type.id)
        )
      }),
    [types],
  )

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
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          field: 'display_internal_id',
          headerClass: 'ag-text-center',
          headerName: 'Activity id',
          minWidth: 150,
          editable: false,
          tooltipField: 'display_internal_id',
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
          ...(hasErrors(rowErrors, 'country_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.country?.name),
          }),
          field: 'country_id',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            details: <sup className="font-bold">*</sup>,
          },
          headerName: tableColumns.country_id,
          minWidth: 150,
          tooltipField: 'country.name',
          valueGetter: (params: any) => params.data.country?.name,
          valueSetter: (params: any) =>
            valueSetter(params, 'country', countries),
        },
        ...(isConsolidatedView
          ? [
              {
                cellClass: 'ag-text-center ag-cell-centered ag-cell-ellipsed',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                  Input: { placeholder: 'Select agency' },
                  agFormatValue,
                  getOptionLabel: (option: any) =>
                    getOptionLabel(agencies, option),
                  isOptionEqualToValue,
                  openOnFocus: true,
                  options: agencies,
                },
                ...(hasErrors(rowErrors, 'agency_id') && {
                  cellRenderer: (props: any) =>
                    editCellRenderer(props, props.data.agency?.name),
                }),
                field: 'agency_id',
                headerClass: 'ag-text-center',
                headerComponentParams: {
                  details: <sup className="font-bold">*</sup>,
                },
                headerName: tableColumns.agency_id,
                minWidth: 150,
                tooltipField: 'agency.name',
                valueGetter: (params: any) => params.data.agency?.name,
                valueSetter: (params: any) =>
                  valueSetter(params, 'agency', agencies),
              },
            ]
          : []),
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select cluster' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(clusters, option),
            isOptionEqualToValue,
            openOnFocus: true,
            options: clusters,
          },
          ...(hasErrors(rowErrors, 'project_cluster_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(
                props,
                props.data.project_cluster?.code ??
                  props.data.project_cluster?.name,
              ),
          }),
          field: 'project_cluster_id',
          headerClass: 'ag-text-center',
          headerName: tableColumns.project_cluster_id,
          minWidth: 120,
          tooltipField: 'project_cluster.name',
          valueGetter: (params: any) =>
            params.data.project_cluster?.code ??
            params.data.project_cluster?.name,
          valueSetter: (params: any) =>
            valueSetter(params, 'project_cluster', clusters),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const projectTypeOfSector = getProjectTypeOfSector(params)
            return {
              Input: { placeholder: 'Select type' },
              agFormatValue,
              getOptionLabel: (option: any) =>
                getOptionLabel(projectTypeOfSector, option),
              isOptionEqualToValue,
              openOnFocus: true,
              options: projectTypeOfSector,
            }
          },
          ...(hasErrors(rowErrors, 'project_type_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(
                props,
                props.data.project_type?.code ?? props.data.project_type?.name,
              ),
          }),
          field: 'project_type_id',
          headerClass: 'ag-text-center',
          headerName: tableColumns.project_type_id,
          minWidth: 120,
          tooltipField: 'project_type.name',
          valueGetter: (params: any) =>
            params.data.project_type?.code ?? params.data.project_type?.name,
          valueSetter: (params: any) =>
            valueSetter(params, 'project_type', getProjectTypeOfSector(params)),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
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
          ...(hasErrors(rowErrors, 'bp_chemical_type_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.bp_chemical_type?.name),
          }),
          field: 'bp_chemical_type_id',
          headerClass: 'ag-text-center',
          headerName: tableColumns.bp_chemical_type_id,
          minWidth: 120,
          tooltipField: 'bp_chemical_type.name',
          valueGetter: (params: any) => params.data.bp_chemical_type?.name,
          valueSetter: (params: any) =>
            valueSetter(params, 'bp_chemical_type', chemicalTypesResults),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: any) => {
            const sectorOfProjectType = getSectorOfProjectType(params)

            return {
              Input: { placeholder: 'Select sector' },
              agFormatValue,
              getOptionLabel: (option: any) =>
                getOptionLabel(sectorOfProjectType, option),
              isOptionEqualToValue,
              openOnFocus: true,
              options: sectorOfProjectType,
            }
          },
          ...(hasErrors(rowErrors, 'sector_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(
                props,
                props.data.sector?.code ?? props.data.sector?.name,
              ),
          }),
          field: 'sector_id',
          headerClass: 'ag-text-center',
          headerName: tableColumns.sector_id,
          minWidth: 120,
          tooltipField: 'sector.name',
          valueGetter: (params: any) =>
            params.data.sector?.code ?? params.data.sector?.name,
          valueSetter: (params: any) =>
            valueSetter(
              params,
              'sector',
              getSectorOfProjectType(params),
              getSubsectorsOfSector(params),
            ),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
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
          ...(hasErrors(rowErrors, 'subsector_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(
                props,
                props.data.subsector?.code ?? props.data.subsector?.name,
              ),
          }),
          field: 'subsector_id',
          headerClass: 'ag-text-center',
          headerName: tableColumns.subsector_id,
          minWidth: 120,
          tooltipField: 'subsector.name',
          valueGetter: (params: any) =>
            params.data.subsector?.code ?? params.data.subsector?.name,
          valueSetter: (params: any) =>
            valueSetter(params, 'subsector', getSubsectorsOfSector(params)),
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'title',
          headerClass: 'ag-text-center',
          headerName: tableColumns.title,
          minWidth: 200,
          ...(hasErrors(rowErrors, 'title') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.title, true),
          }),
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
              options: substances,
              field: 'substances',
            }),
          field: 'substances',
          headerClass: 'ag-text-center',
          headerName: tableColumns.substances,
          minWidth: 230,
          valueSetter: (params: any) =>
            substancesValueSetter(params, substances),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          field: 'required_by_model',
          headerClass: 'ag-text-center',
          headerComponent: function (props: any) {
            return (
              <HeaderPasteWrapper
                addTopMargin={true}
                field={props.column.colDef.field}
                label={props.displayName}
                setForm={setForm}
              />
            )
          },
          ...(hasErrors(rowErrors, 'required_by_model') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.required_by_model),
          }),
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
          cellRendererParams: () => ({
            tooltipClassName: 'bp-table-tooltip',
          }),
          dataType: 'number',
          field: 'amount_polyol',
          headerClass: 'ag-text-center',
          headerName: tableColumns.amount_polyol,
          minWidth: 100,
          cellRenderer: (props: any) =>
            editCellRenderer(props, props.data.amount_polyol),
          valueGetter: (params: any) => {
            const polyolAmount = params.data.amount_polyol
            return !isNil(polyolAmount) ? parseFloat(polyolAmount) : null
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
          ...(hasErrors(rowErrors, 'status') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.status),
          }),
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
              getOptionLabel(multiYearFilterOptions, option, 'name'),
            isOptionEqualToValue: isOptionEqualToValueByName,
            openOnFocus: true,
            options: multiYearFilterOptions,
          },
          field: 'is_multi_year',
          headerClass: 'ag-text-center',
          headerName: tableColumns.is_multi_year,
          minWidth: 120,
          ...(hasErrors(rowErrors, 'is_multi_year') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.is_multi_year ? 'MYA' : 'IND'),
          }),
          tooltipValueGetter: (params: ITooltipParams) =>
            params.data.is_multi_year_display ??
            multiYearFilterOptions[1].fullName,
          valueGetter: (params: any) =>
            params.data.is_multi_year ? 'MYA' : 'IND',
          valueSetter: (params: any) =>
            MYAValueSetter(params, multiYearFilterOptions),
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'remarks',
          headerClass: 'ag-text-center',
          headerName: tableColumns.remarks,
          minWidth: 200,
          ...(hasErrors(rowErrors, 'remarks') && {
            cellRenderer: (props: any) =>
              editCellRenderer(
                { ...props, withoutTruncation: true },
                props.data.remarks,
                true,
              ),
          }),
          tooltipField: 'remarks',
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'comment_secretariat',
          headerClass: 'ag-text-center',
          headerComponent: function (props: any) {
            return (
              <HeaderPasteWrapper
                addTopMargin={true}
                field={props.column.colDef.field}
                label={props.displayName}
                setForm={setForm}
              />
            )
          },
          headerName: tableColumns.comment_secretariat,
          minWidth: 200,
          ...(hasErrors(rowErrors, 'comment_secretariat') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.comment_secretariat, true),
          }),
          tooltipField: 'comment_secretariat',
          valueSetter: (params: any) => {
            params.data.comment_secretariat = params.newValue ?? ''
            return true
          },
        },
      ],
      defaultColDef: {
        editable: true,
        enableCellChangeFlash: false,
        resizable: true,
      },
    }),
    [
      countries,
      clusters,
      isConsolidatedView,
      form,
      setForm,
      types,
      getSubsectorsOfSector,
      getSectorOfProjectType,
      getProjectTypeOfSector,
      chemicalTypesResults,
      sectors,
      substances,
      statuses,
      yearColumns,
      onRemoveActivity,
      agencies,
    ],
  )

  return colsOptions
}

export default useColumnsOptions
