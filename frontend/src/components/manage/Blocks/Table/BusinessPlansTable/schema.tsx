import { Tooltip } from '@mui/material'

import CommentsTagList from './CommentsTagList'

const defaultColumnDefs = [
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text ag-country-cell-text',
    field: 'country.name',
    headerClass: 'ag-text-center',
    headerName: 'Country',
    minWidth: 150,
    resizable: true,
    sortable: true,
    tooltipField: 'country.name',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'project_cluster.code',
    headerClass: 'ag-text-center',
    headerName: 'Cluster',
    minWidth: 70,
    resizable: true,
    sortable: true,
    tooltipField: 'project_cluster.name',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'project_type.code',
    headerClass: 'ag-text-center',
    headerName: 'Type',
    minWidth: 70,
    resizable: true,
    sortable: true,
    tooltipField: 'project_type.name',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'sector.code',
    headerClass: 'ag-text-center',
    headerName: 'Sector',
    minWidth: 70,
    resizable: true,
    sortable: true,
    tooltipField: 'sector.name',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'subsector.code',
    headerClass: 'ag-text-center',
    headerName: 'Subsector',
    minWidth: 100,
    resizable: true,
    sortable: true,
    tooltipField: 'subsector.name',
  },
  {
    autoHeight: true,
    // cellRenderer: (params: any) => (
    //   <Link href={`/business-plans/${params.data.id}`}>
    //     {params.data.title}
    //   </Link>
    // ),
    cellClass: 'ag-cell-wrap-text',
    field: 'title',
    headerName: 'Title',
    minWidth: 200,
    resizable: true,
    sortable: true,
    tooltipField: 'title',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'required_by_model',
    headerClass: 'ag-text-center',
    headerName: 'Required by model',
    minWidth: 150,
    resizable: true,
    sortable: true,
    tooltipField: 'required_by_model',
  },
]

const valuesColumnDefs = (yearColumns: any[]) => [
  ...defaultColumnDefs,
  yearColumns.find(
    (column: { headerName: string }) => column.headerName === 'Value ($000)',
  ) || [],
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    field: 'status',
    headerClass: 'ag-text-center',
    headerName: 'Status',
    minWidth: 100,
    resizable: true,
    sortable: true,
    tooltipField: 'status_display',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    field: 'is_multi_year',
    headerClass: 'ag-text-center',
    headerName: 'IND/MYA',
    minWidth: 100,
    resizable: true,
    sortable: true,
    tooltipField: 'is_multi_year_display',
    valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
  },
]

const odpColumnDefs = (yearColumns: any[]) => [
  ...defaultColumnDefs,
  ...(yearColumns.filter(
    (column: { headerName: string }) =>
      column.headerName === 'ODP' || column.headerName === 'MT for HFC',
  ) || []),
]

const commentsCellRenderer = (props: any) => {
  const { commentSecretariat, commentTypes } = props.value

  return (
    <div className="p-1.5 text-left">
      <CommentsTagList comments={commentTypes} />
      <Tooltip
        TransitionProps={{ timeout: 0 }}
        classes={{ tooltip: 'bp-table-tooltip' }}
        title={commentSecretariat}
      >
        {commentSecretariat}
      </Tooltip>
    </div>
  )
}

const commentsValueGetter = (params: any) => {
  return {
    commentSecretariat: params.data.comment_secretariat,
    commentTypes: params.data.comment_types,
  }
}

const commentsColumnDefs = () => [
  ...defaultColumnDefs,
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'reason_for_exceeding',
    headerClass: 'ag-text-center',
    headerName: 'Reason for Exceeding',
    minWidth: 200,
    resizable: true,
    sortable: true,
    tooltipField: 'reason_for_exceeding',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'remarks',
    headerClass: 'ag-text-center',
    headerName: 'Remarks',
    minWidth: 200,
    resizable: true,
    sortable: true,
    tooltipField: 'remarks',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    cellRenderer: commentsCellRenderer,
    field: 'comment_secretariat',
    headerClass: 'ag-text-center',
    headerName: 'Comment',
    minWidth: 200,
    resizable: true,
    sortable: true,
    valueGetter: commentsValueGetter,
  },
]

const allColumnDefs = (yearColumns: any[]) => [
  ...defaultColumnDefs,
  {
    autoHeight: true,
    // cellRenderer: (params: any) => (
    //   <Link href={`/business-plans/${params.data.id}`}>
    //     {params.data.title}
    //   </Link>
    // ),
    field: 'substances_display',
    headerClass: 'ag-text-center',
    headerName: 'Substances',
    minWidth: 200,
    resizable: true,
    sortable: true,
    valueGetter: ({ data }: any) => data.substances_display?.join(',') || '-',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    field: 'amount_polyol',
    headerClass: 'ag-text-center',
    headerName: 'Polyol Amount',
    minWidth: 100,
    resizable: true,
    sortable: true,
  },
  ...yearColumns,
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    field: 'status',
    headerClass: 'ag-text-center',
    headerName: 'Status',
    minWidth: 100,
    resizable: true,
    sortable: true,
    tooltipField: 'status_display',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    field: 'is_multi_year',
    headerClass: 'ag-text-center',
    headerName: 'IND/MYA',
    minWidth: 100,
    resizable: true,
    sortable: true,
    tooltipField: 'is_multi_year_display',
    valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'reason_for_exceeding',
    headerClass: 'ag-text-center',
    headerName: 'Reason for Exceeding',
    minWidth: 200,
    resizable: true,
    sortable: true,
    tooltipField: 'reason_for_exceeding',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'remarks',
    headerClass: 'ag-text-center',
    headerName: 'Remarks',
    minWidth: 200,
    resizable: true,
    sortable: true,
    tooltipField: 'remarks',
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    cellRenderer: commentsCellRenderer,
    field: 'comment_secretariat',
    headerClass: 'ag-text-center',
    headerName: 'Comment',
    minWidth: 200,
    resizable: true,
    sortable: true,
    valueGetter: commentsValueGetter,
  },
]

export {
  allColumnDefs,
  commentsColumnDefs,
  defaultColumnDefs,
  odpColumnDefs,
  valuesColumnDefs,
}
