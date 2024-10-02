import { isNull } from 'lodash'

import { tagsCellRenderer } from '../../Table/BusinessPlansTable/schemaHelpers'

const allColumnDefs = (yearColumns: any[]) => [
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
    field: 'sector.code',
    headerClass: 'ag-text-center',
    headerName: 'Sector',
    minWidth: 70,
    tooltipField: 'sector.name',
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
    tooltipField: 'title',
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
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'required_by_model',
    headerClass: 'ag-text-center',
    headerName: 'Required by model',
    minWidth: 150,
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

      return !isNull(polyolAmount) ? parseFloat(polyolAmount).toFixed(2) : null
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
    tooltipField: 'reason_for_exceeding',
  },
  {
    cellClass: 'ag-cell-wrap-text',
    field: 'remarks',
    headerClass: 'ag-text-center',
    headerName: 'Remarks',
    minWidth: 200,
    tooltipField: 'remarks',
  },
  {
    cellClass: 'ag-cell-wrap-text',
    field: 'comment_secretariat',
    headerClass: 'ag-text-center',
    headerName: 'Comment',
    minWidth: 200,
    tooltipField: 'comment_secretariat',
  },
  {
    cellRenderer: tagsCellRenderer,
    field: 'comment_types',
    headerClass: 'ag-text-center',
    headerName: 'Tags',
    minWidth: 230,
  },
]

const defaultColDef = {
  autoHeight: true,
  editable: true,
  resizable: true,
}

export { allColumnDefs, defaultColDef }
