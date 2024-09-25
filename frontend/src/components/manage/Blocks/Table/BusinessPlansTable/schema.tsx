import {
  cellValueGetter,
  commentsCellRenderer,
  commentsDiffCellRenderer,
  commentsDiffValueGetter,
  commentsValueGetter,
  numberCellGetter,
  numberCellRenderer,
  objectCellValueGetter,
  substancesCellRenderer,
  substancesDiffCellRenderer,
  textCellRenderer,
} from './schemaHelpers'

const getDefaultColumnDefs = (isDiff?: boolean) => [
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text ag-country-cell-text',
    field: 'country.name',
    headerClass: 'ag-text-center',
    headerName: 'Country',
    minWidth: 150,
    resizable: true,
    sortable: true,
    ...(!isDiff && { tooltipField: 'country.name' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => objectCellValueGetter(params, 'country'),
    }),
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
    ...(!isDiff && { tooltipField: 'project_cluster.name' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) =>
        objectCellValueGetter(params, 'project_cluster'),
    }),
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
    ...(!isDiff && { tooltipField: 'project_type.name' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) =>
        objectCellValueGetter(params, 'project_type'),
    }),
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'bp_chemical_type.name',
    headerClass: 'ag-text-center',
    headerName: 'Chemical type',
    minWidth: 100,
    resizable: true,
    sortable: true,
    ...(!isDiff && { tooltipField: 'bp_chemical_type.name' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) =>
        objectCellValueGetter(params, 'bp_chemical_type'),
    }),
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
    ...(!isDiff && { tooltipField: 'sector.name' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => objectCellValueGetter(params, 'sector'),
    }),
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
    ...(!isDiff && { tooltipField: 'subsector.name' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => objectCellValueGetter(params, 'subsector'),
    }),
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
    ...(!isDiff && { tooltipField: 'title' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'title'),
    }),
  },
]

const getReqByModelColumn = (isDiff?: boolean) => {
  return {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'required_by_model',
    headerClass: 'ag-text-center',
    headerName: 'Required by model',
    minWidth: 150,
    resizable: true,
    sortable: true,
    ...(!isDiff && { tooltipField: 'required_by_model' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) =>
        cellValueGetter(params, 'required_by_model'),
    }),
  }
}

const valuesColumnDefs = (yearColumns: any[], isDiff?: boolean) => [
  ...getDefaultColumnDefs(isDiff),
  getReqByModelColumn(isDiff),
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
    ...(!isDiff && { tooltipField: 'status_display' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'status'),
    }),
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
    ...(!isDiff && {
      tooltipField: 'is_multi_year_display',
      valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
    }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'is_multi_year'),
    }),
  },
]

const odpColumnDefs = (yearColumns: any[], isDiff?: boolean) => [
  ...getDefaultColumnDefs(isDiff),
  getReqByModelColumn(isDiff),
  ...(yearColumns.filter(
    (column: { headerName: string }) =>
      column.headerName === 'ODP' || column.headerName === 'MT for HFC',
  ) || []),
]

const commentsColumnDefs = (isDiff?: boolean) => [
  ...getDefaultColumnDefs(isDiff),
  getReqByModelColumn(isDiff),
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'reason_for_exceeding',
    headerClass: 'ag-text-center',
    headerName: 'Reason for Exceeding',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(!isDiff && { tooltipField: 'reason_for_exceeding' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) =>
        cellValueGetter(params, 'reason_for_exceeding'),
    }),
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
    ...(!isDiff && { tooltipField: 'remarks' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'remarks'),
    }),
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'comment_secretariat',
    headerClass: 'ag-text-center',
    headerName: 'Comment',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(!isDiff && {
      cellRenderer: commentsCellRenderer,
      valueGetter: commentsDiffValueGetter,
    }),
    ...(isDiff && {
      cellRenderer: commentsDiffCellRenderer,
      valueGetter: (params: any) => commentsDiffValueGetter(params),
    }),
  },
]

const allColumnDefs = (yearColumns: any[], isDiff?: boolean) => [
  ...getDefaultColumnDefs(isDiff),
  {
    autoHeight: true,
    cellClass: 'ag-substances-cell-content',
    field: 'substances_display',
    headerClass: 'ag-text-center',
    headerName: 'Substances',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(!isDiff && { cellRenderer: substancesCellRenderer }),
    ...(isDiff && {
      cellRenderer: substancesDiffCellRenderer,
      valueGetter: (params: any) =>
        cellValueGetter(params, 'substances_display'),
    }),
  },
  getReqByModelColumn(isDiff),
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    cellRenderer: numberCellRenderer,
    field: 'amount_polyol',
    headerClass: 'ag-text-center',
    headerName: 'Polyol Amount',
    minWidth: 100,
    resizable: true,
    sortable: true,
    valueGetter: (params: any) => numberCellGetter(params, 'amount_polyol'),
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
    ...(!isDiff && { tooltipField: 'status_display' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'status'),
    }),
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
    ...(!isDiff && {
      tooltipField: 'is_multi_year_display',
      valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
    }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'is_multi_year'),
    }),
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
    ...(!isDiff && { tooltipField: 'reason_for_exceeding' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) =>
        cellValueGetter(params, 'reason_for_exceeding'),
    }),
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
    ...(!isDiff && { tooltipField: 'remarks' }),
    ...(isDiff && {
      cellRenderer: textCellRenderer,
      valueGetter: (params: any) => cellValueGetter(params, 'remarks'),
    }),
  },
  {
    autoHeight: true,
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'comment_secretariat',
    headerClass: 'ag-text-center',
    headerName: 'Comment',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: commentsDiffCellRenderer,
          valueGetter: (params: any) => commentsDiffValueGetter(params),
        }
      : {
          cellRenderer: commentsCellRenderer,
          valueGetter: commentsValueGetter,
        }),
  },
]

export { allColumnDefs, commentsColumnDefs, odpColumnDefs, valuesColumnDefs }
