import { Dispatch, SetStateAction } from 'react'

import { tagsCellRenderer } from '@ors/components/manage/Blocks/Table/BusinessPlansTable/schemaHelpers'
import { tableColumns } from '@ors/components/manage/Blocks/BusinessPlans/constants'
import { LinkableActivity } from './LinkedBPTable'
import { formatDecimalValue } from '@ors/helpers'

import { Checkbox } from '@mui/material'
import {
  ICellRendererParams,
  ITooltipParams,
  ValueGetterParams,
} from 'ag-grid-community'

const bpLinkColumnDefs = (
  yearColumns: any[],
  setBpId: Dispatch<SetStateAction<number | null>>,
) => [
  {
    headerName: 'Select',
    field: '',
    minWidth: 80,
    maxWidth: 80,
    sortable: false,
    cellClass: 'ag-text-center',
    cellRenderer: (params: ICellRendererParams<LinkableActivity>) => (
      <Checkbox
        checked={params.data?.selected}
        onChange={(event) => {
          setBpId(event.target.checked ? params.data!.id : null)
        }}
        sx={{
          color: 'black',
        }}
      />
    ),
  },
  {
    headerName: 'Activity ID',
    field: 'display_internal_id',
    tooltipField: 'display_internal_id',
    minWidth: 150,
    sortable: false,
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
  },
  {
    headerName: tableColumns.lvc_status,
    field: 'lvc_status',
    tooltipField: 'lvc_status',
    minWidth: 90,
    sortable: false,
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
  },
  {
    headerName: tableColumns.project_type_id,
    field: 'project_type.code',
    tooltipField: 'project_type.name',
    minWidth: 70,
    cellClass: 'ag-text-center ag-cell-ellipsed',
    valueGetter: (params: ValueGetterParams<LinkableActivity>) =>
      params.data?.project_type.code ?? params.data?.project_type.name,
  },
  {
    headerName: tableColumns.bp_chemical_type_id,
    field: 'bp_chemical_type.name',
    tooltipField: 'bp_chemical_type.name',
    minWidth: 100,
    cellClass: 'ag-text-center ag-cell-ellipsed',
  },
  {
    headerName: tableColumns.substances,
    field: 'substances_display',
    minWidth: 130,
    cellClass: 'ag-tags-cell-content',
    cellRenderer: tagsCellRenderer,
  },
  {
    headerName: tableColumns.amount_polyol,
    field: 'amount_polyol',
    minWidth: 120,
    cellClass: 'ag-text-center',
    valueGetter: (params: ValueGetterParams<LinkableActivity>) => {
      const polyolAmount = params.data?.amount_polyol

      return polyolAmount
        ? formatDecimalValue(parseFloat(polyolAmount))
        : '0.00'
    },
    tooltipValueGetter: (params: ITooltipParams<LinkableActivity>) => {
      const polyolAmount = params.data?.amount_polyol

      return polyolAmount
        ? formatDecimalValue(parseFloat(polyolAmount), {
            maximumFractionDigits: 10,
            minimumFractionDigits: 2,
          })
        : '0.00'
    },
  },
  {
    headerName: tableColumns.sector_id,
    field: 'sector.code',
    tooltipField: 'sector.name',
    minWidth: 70,
    cellClass: 'ag-text-center ag-cell-ellipsed',
    valueGetter: (params: ValueGetterParams<LinkableActivity>) =>
      params.data?.sector?.code ?? params.data?.sector?.name,
  },
  {
    headerName: tableColumns.subsector_id,
    field: 'subsector.code',
    tooltipField: 'subsector.name',
    minWidth: 100,
    cellClass: 'ag-text-center ag-cell-ellipsed',
    valueGetter: (params: ValueGetterParams<LinkableActivity>) =>
      params.data?.subsector?.code ?? params.data?.subsector?.name,
  },
  {
    headerName: tableColumns.title,
    field: 'title',
    tooltipField: 'title',
    minWidth: 200,
    cellClass: 'ag-cell-ellipsed',
  },
  {
    headerName: tableColumns.required_by_model,
    field: 'required_by_model',
    tooltipField: 'required_by_model',
    minWidth: 150,
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
  },
  ...yearColumns,
  {
    headerName: tableColumns.status,
    field: 'status',
    tooltipField: 'status_display',
    minWidth: 100,
    cellClass: 'ag-text-center',
  },
  {
    headerName: tableColumns.is_multi_year,
    field: 'is_multi_year',
    tooltipField: 'is_multi_year_display',
    minWidth: 100,
    cellClass: 'ag-text-center',
    valueGetter: ({ data }: ValueGetterParams<LinkableActivity>) =>
      data?.is_multi_year ? 'M' : 'I',
  },
  {
    headerName: tableColumns.remarks,
    field: 'remarks',
    tooltipField: 'remarks',
    minWidth: 200,
    cellClass: 'ag-cell-ellipsed',
  },
  {
    headerName: tableColumns.comment_secretariat,
    field: 'comment_secretariat',
    tooltipField: 'comment_secretariat',
    minWidth: 200,
    cellClass: 'ag-cell-ellipsed',
  },
]

const defaultColDefBpLink = {
  headerClass: 'ag-text-center',
  resizable: true,
  sortable: true,
}

export { bpLinkColumnDefs, defaultColDefBpLink }
