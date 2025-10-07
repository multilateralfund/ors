import { useCallback, useContext, useMemo } from 'react'

import BPDataContext from '@ors/contexts/BusinessPlans/BPDataContext'
import { PendingEditType } from './BPEditTable'
import { useGetClusterOptions } from '../useGetClusterOptions'
import { useStore } from '@ors/store'
import {
  editCellRenderer,
  EditTagsCellRenderer,
} from '../BPTableHelpers/cellRenderers'
import { filterSubsectors, hasErrors } from '../utils'
import { BPEditTableInterface, chemicalTypesType } from '../types'
import { lvcStatuses, multiYearFilterOptions, tableColumns } from '../constants'
import {
  MYAValueSetter,
  agFormatNameValue,
  agFormatValue,
  agFormatValueTags,
  getClusterTypesOpts,
  getTypeSectorsOpts,
  getSectorSubsectorsOpts,
  getOptionLabel,
  getOptions,
  isOptionEqualToValue,
  isOptionEqualToValueByCode,
  isOptionEqualToValueByName,
  lvcValueSetter,
  statusValueSetter,
  substancesValueSetter,
  valueSetter,
} from './editSchemaHelpers'

import {
  ICellEditorParams,
  ITooltipParams,
  ValueSetterParams,
} from 'ag-grid-community'
import { filter, find, flatMap, get, isNil, map } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { HeaderPasteWrapper } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport/HeaderPasteWrapper.tsx'

const optionTextClassname = 'text-base'
const optionClassname = '!pl-1.5'

const useColumnsOptions = (
  yearColumns: any[],
  onRemoveActivity: (props: any) => void,
  form: BPEditTableInterface['form'],
  setForm: BPEditTableInterface['setForm'],
  chemicalTypes: chemicalTypesType,
  activitiesRef: any,
  setPendingEdit: (value: PendingEditType) => void,
  isConsolidatedView?: boolean,
) => {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const cpReportsSlice = useStore((state) => state.cp_reports)
  const bpSlice = useStore((state) => state.businessPlans)

  const { results: clusterOptions } = useGetClusterOptions()
  const { agencies, countries } = useContext(BPDataContext)

  const clusters = projectSlice.clusters.data
  const types = bpSlice.types.data
  const sectors = bpSlice.sectors.data
  const subsectors = filterSubsectors(bpSlice.subsectors.data)
  const substances = cpReportsSlice.substances.data.filter((subst) =>
    [6, 10, 11].includes(subst.group_id),
  )
  const statuses =
    commonSlice.settings.data.business_plan_activity_statuses.map((status) => ({
      id: status[0],
      name: status[1],
    }))
  const chemicalTypesResults = chemicalTypes.results

  const { rowErrors } = useStore((state) => state.bpErrors)

  const filteredOptions = (
    params: any,
    field: string,
    options: any[],
    parentIds: any[],
  ) =>
    params.data?.[field]?.name === 'Other'
      ? options
      : filter(
          options,
          (option) => option.name === 'Other' || parentIds.includes(option.id),
        )

  const getProjectTypesOfCluster = useCallback(
    (params: ICellEditorParams | ValueSetterParams) => {
      const clusterTypes = getClusterTypesOpts(
        params.data?.project_cluster_id,
        clusterOptions,
      )
      const clusterTypesIds = map(clusterTypes, 'type_id')

      return filteredOptions(params, 'project_cluster', types, clusterTypesIds)
    },
    [types, clusterOptions],
  )

  const getSectorsOfProjectType = useCallback(
    (params: ICellEditorParams | ValueSetterParams) => {
      const isOtherCluster = params.data?.project_cluster?.name === 'Other'

      const clusterTypes = getClusterTypesOpts(
        params.data?.project_cluster_id,
        clusterOptions,
      )

      const crtTypeSectorMapping = get(
        find(
          flatMap(clusterOptions, (cluster) => cluster.types),
          (type) => type.type_name === params.data?.project_type?.name,
        ),
        'sectors',
        [],
      )

      const typeSectors = isOtherCluster
        ? crtTypeSectorMapping
        : getTypeSectorsOpts(params.data?.project_type_id, clusterTypes)

      const typeSectorsIds = map(typeSectors, 'sector_id')

      return filteredOptions(params, 'project_type', sectors, typeSectorsIds)
    },
    [sectors, clusterOptions],
  )

  const getSubsectorsOfSector = useCallback(
    (params: ICellEditorParams | ValueSetterParams) => {
      const sectorSubsectors = getSectorSubsectorsOpts(
        params.data?.sector_id,
        sectors,
      )
      const sectorSubsectorsIds = map(sectorSubsectors, 'id')

      return filteredOptions(params, 'sector', subsectors, sectorSubsectorsIds)
    },
    [subsectors, clusterOptions],
  )

  const colsOptions = useMemo(
    () => ({
      columnDefs: [
        {
          cellClass: 'remove-activity-col',
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
          resizable: false,
          field: '',
          minWidth: 20,
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          field: 'display_internal_id',
          headerName: 'Activity ID',
          minWidth: 150,
          editable: false,
          tooltipField: 'display_internal_id',
        },
        {
          cellClass: 'ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select country' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(countries, option),
            isOptionEqualToValue: isOptionEqualToValueByName,
            openOnFocus: true,
            options: countries,
            optionTextClassname,
          },
          ...(hasErrors(rowErrors, 'country_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.country?.name),
          }),
          field: 'country_id',
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
                  isOptionEqualToValue: isOptionEqualToValueByName,
                  openOnFocus: true,
                  options: agencies,
                  optionTextClassname,
                },
                ...(hasErrors(rowErrors, 'agency_id') && {
                  cellRenderer: (props: any) =>
                    editCellRenderer(props, props.data.agency?.name),
                }),
                field: 'agency_id',
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
          cellClass: 'ag-text-center ag-cell-centered ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select status' },
            agFormatValue,
            getOptionLabel: (option: any) =>
              getOptionLabel(lvcStatuses, option),
            isOptionEqualToValue,
            openOnFocus: true,
            options: lvcStatuses,
            optionTextClassname,
          },
          ...(hasErrors(rowErrors, 'lvc_status') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.lvc_status),
          }),
          field: 'lvc_status',
          headerName: tableColumns.lvc_status,
          minWidth: 100,
          tooltipField: 'lvc_status',
          valueGetter: (params: any) => params.data.lvc_status,
          valueSetter: (params: any) => lvcValueSetter(params, 'lvc_status'),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select cluster' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(clusters, option),
            isOptionEqualToValue: isOptionEqualToValueByCode,
            openOnFocus: true,
            freeSolo: true,
            options: clusters,
            optionClassname,
            optionTextClassname,
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
          headerName: tableColumns.project_cluster_id,
          minWidth: 120,
          tooltipField: 'project_cluster.name',
          valueGetter: (params: any) =>
            params.data.project_cluster?.code ??
            params.data.project_cluster?.name,
          valueSetter: (params: ValueSetterParams) =>
            valueSetter(
              params,
              'project_cluster',
              clusters,
              clusterOptions,
              setPendingEdit,
              sectors,
            ),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: ICellEditorParams) => {
            const projectTypeOfCluster = getProjectTypesOfCluster(params)
            return {
              Input: { placeholder: 'Select type' },
              agFormatValue,
              getOptionLabel: (option: any) =>
                getOptionLabel(projectTypeOfCluster, option),
              isOptionEqualToValue: isOptionEqualToValueByCode,
              openOnFocus: true,
              freeSolo: true,
              options: projectTypeOfCluster,
              optionTextClassname,
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
          headerName: tableColumns.project_type_id,
          minWidth: 120,
          tooltipField: 'project_type.name',
          valueGetter: (params: any) =>
            params.data.project_type?.code ?? params.data.project_type?.name,
          valueSetter: (params: ValueSetterParams) =>
            valueSetter(
              params,
              'project_type',
              getProjectTypesOfCluster(params),
              clusterOptions,
              setPendingEdit,
              sectors,
            ),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select chemical' },
            agFormatValue,
            getOptionLabel: (option: any) =>
              getOptionLabel(chemicalTypesResults, option),
            isOptionEqualToValue: isOptionEqualToValueByName,
            openOnFocus: true,
            options: chemicalTypesResults,
            optionTextClassname,
          },
          ...(hasErrors(rowErrors, 'bp_chemical_type_id') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.bp_chemical_type?.name),
          }),
          field: 'bp_chemical_type_id',
          headerName: tableColumns.bp_chemical_type_id,
          minWidth: 120,
          tooltipField: 'bp_chemical_type.name',
          valueGetter: (params: any) => params.data.bp_chemical_type?.name,
          valueSetter: (params: any) =>
            valueSetter(params, 'bp_chemical_type', chemicalTypesResults),
        },
        {
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: {
              placeholder: 'Select chemical detail',
            },
            agFormatValue: agFormatValueTags,
            getOptionLabel: (option: any) => getOptionLabel(substances, option),
            getOptions: (value: any) => getOptions(value, substances),
            isMultiple: true,
            isOptionEqualToValue,
            openOnFocus: true,
            showUnselectedOptions: true,
            optionTextClassname,
          },
          cellRenderer: (props: any) =>
            EditTagsCellRenderer({
              ...{ form, props, setForm },
              options: substances,
              field: 'substances',
            }),
          field: 'substances',
          headerName: tableColumns.substances,
          minWidth: 150,
          valueSetter: (params: any) =>
            substancesValueSetter(params, substances),
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
          headerName: tableColumns.amount_polyol,
          minWidth: 120,
          cellRenderer: (props: any) =>
            editCellRenderer(
              props,
              props.data.amount_polyol > 0 ? props.data.amount_polyol : 0,
            ),
          valueGetter: (params: any) => {
            const polyolAmount =
              params.data.amount_polyol > 0 ? params.data.amount_polyol : 0
            return !isNil(polyolAmount) ? parseFloat(polyolAmount) : 0
          },
          valueSetter: (params: any) => {
            const polyolAmount = params.newValue > 0 ? params.newValue : 0
            params.data.amount_polyol = !isNil(polyolAmount)
              ? parseFloat(polyolAmount)
              : 0

            return true
          },
          wrapText: true,
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: ICellEditorParams) => {
            const sectorOfProjectType = getSectorsOfProjectType(params)

            return {
              Input: { placeholder: 'Select sector' },
              agFormatValue,
              getOptionLabel: (option: any) =>
                getOptionLabel(sectorOfProjectType, option),
              isOptionEqualToValue: isOptionEqualToValueByCode,
              openOnFocus: true,
              freeSolo: true,
              options: sectorOfProjectType,
              optionTextClassname,
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
          headerName: tableColumns.sector_id,
          minWidth: 120,
          tooltipField: 'sector.name',
          valueGetter: (params: any) =>
            params.data.sector?.code ?? params.data.sector?.name,
          valueSetter: (params: ValueSetterParams) =>
            valueSetter(
              params,
              'sector',
              getSectorsOfProjectType(params),
              clusterOptions,
              setPendingEdit,
              sectors,
            ),
        },
        {
          cellClass: 'ag-text-center ag-cell-ellipsed',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: (params: ICellEditorParams) => {
            const subsectorsOfSector = getSubsectorsOfSector(params)

            return {
              Input: { placeholder: 'Select subsector' },
              agFormatValue,
              getOptionLabel: (option: any) =>
                getOptionLabel(subsectorsOfSector, option),
              isOptionEqualToValue: isOptionEqualToValueByCode,
              openOnFocus: true,
              freeSolo: true,
              options: subsectorsOfSector,
              optionTextClassname,
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
          headerName: tableColumns.subsector_id,
          minWidth: 120,
          tooltipField: 'subsector.name',
          valueGetter: (params: any) =>
            params.data.subsector?.code ?? params.data.subsector?.name,
          valueSetter: (params: ValueSetterParams) =>
            valueSetter(
              params,
              'subsector',
              getSubsectorsOfSector(params),
              null,
              setPendingEdit,
              sectors,
            ),
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'title',
          headerName: tableColumns.title,
          minWidth: 200,
          ...(hasErrors(rowErrors, 'title') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.title, true),
          }),
          tooltipField: 'title',
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'required_by_model',
          headerComponent: function (props: any) {
            return (
              <HeaderPasteWrapper
                field={props.column.colDef.field}
                label={props.displayName}
                setForm={setForm}
                form={form}
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
        ...yearColumns,
        {
          cellClass: 'ag-text-center',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select A/P' },
            agFormatValue,
            getOptionLabel: (option: any) => getOptionLabel(statuses, option),
            isOptionEqualToValue,
            openOnFocus: true,
            options: statuses,
            optionTextClassname,
          },
          ...(hasErrors(rowErrors, 'status') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.status),
          }),
          field: 'status',
          headerName: tableColumns.status,
          minWidth: 120,
          tooltipField: 'status_display',
          valueSetter: (params: any) => statusValueSetter(params, statuses),
        },
        {
          cellClass: 'ag-text-center',
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            Input: { placeholder: 'Select I/M' },
            agFormatValue: agFormatNameValue,
            getOptionLabel: (option: any) =>
              getOptionLabel(multiYearFilterOptions, option, 'name'),
            isOptionEqualToValue: isOptionEqualToValueByName,
            openOnFocus: true,
            options: multiYearFilterOptions,
            optionTextClassname,
          },
          field: 'is_multi_year',
          headerName: tableColumns.is_multi_year,
          minWidth: 120,
          ...(hasErrors(rowErrors, 'is_multi_year') && {
            cellRenderer: (props: any) =>
              editCellRenderer(props, props.data.is_multi_year ? 'M' : 'I'),
          }),
          tooltipValueGetter: (params: ITooltipParams) =>
            params.data.is_multi_year_display ??
            multiYearFilterOptions[1].fullName,
          valueGetter: (params: any) => (params.data.is_multi_year ? 'M' : 'I'),
          valueSetter: (params: any) =>
            MYAValueSetter(params, multiYearFilterOptions),
        },
        {
          cellClass: 'ag-cell-ellipsed',
          field: 'remarks',
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
      ],
      defaultColDef: {
        headerClass: 'ag-text-center',
        editable: true,
        enableCellChangeFlash: false,
        resizable: true,
      },
    }),
    [
      countries,
      clusters,
      isConsolidatedView,
      activitiesRef,
      form,
      setForm,
      types,
      getSubsectorsOfSector,
      getSectorsOfProjectType,
      getProjectTypesOfCluster,
      chemicalTypesResults,
      sectors,
      substances,
      statuses,
      yearColumns,
      onRemoveActivity,
      agencies,
      clusterOptions,
    ],
  )

  return colsOptions
}

export default useColumnsOptions
