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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'country'),
        }
      : { tooltipField: 'country.name' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'project_cluster'),
        }
      : { tooltipField: 'project_cluster.name' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'project_type'),
        }
      : { tooltipField: 'project_type.name' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'bp_chemical_type'),
        }
      : { tooltipField: 'bp_chemical_type.name' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => objectCellValueGetter(params, 'sector'),
        }
      : { tooltipField: 'sector.name' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'subsector'),
        }
      : { tooltipField: 'subsector.name' }),
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
    headerClass: 'ag-text-center',
    headerName: 'Title',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'title'),
        }
      : { tooltipField: 'title' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'required_by_model'),
        }
      : { tooltipField: 'required_by_model' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'status'),
        }
      : { tooltipField: 'status_display' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'is_multi_year'),
        }
      : {
          tooltipField: 'is_multi_year_display',
          valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
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
    cellClass: 'ag-cell-wrap-text',
    field: 'reason_for_exceeding',
    headerClass: 'ag-text-center',
    headerName: 'Reason for Exceeding',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'reason_for_exceeding'),
        }
      : { tooltipField: 'reason_for_exceeding' }),
  },
  {
    autoHeight: true,
    cellClass: 'ag-cell-wrap-text',
    field: 'remarks',
    headerClass: 'ag-text-center',
    headerName: 'Remarks',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'remarks'),
        }
      : { tooltipField: 'remarks' }),
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
          valueGetter: commentsDiffValueGetter,
        }),
  },
]

const allColumnDefs = (yearColumns: any[], isDiff?: boolean) => [
  ...getDefaultColumnDefs(isDiff),
  {
    autoHeight: true,
    cellClass: !isDiff && 'ag-substances-cell-content',
    field: 'substances_display',
    headerClass: 'ag-text-center',
    headerName: 'Substances',
    minWidth: 230,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: substancesDiffCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'substances_display'),
        }
      : { cellRenderer: substancesCellRenderer }),
  },
  getReqByModelColumn(isDiff),
  {
    autoHeight: true,
    cellClass: 'ag-text-center',
    field: 'amount_polyol',
    headerClass: 'ag-text-center',
    headerName: 'Polyol Amount',
    minWidth: 100,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: numberCellRenderer,
          valueGetter: (params: any) =>
            numberCellGetter(params, 'amount_polyol'),
        }
      : {
          valueGetter: (params: any) => {
            const polyolAmount = params.data.amount_polyol
            return polyolAmount ? parseFloat(polyolAmount).toFixed(2) : null
          },
        }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'status'),
        }
      : { tooltipField: 'status_display' }),
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
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'is_multi_year'),
        }
      : {
          tooltipField: 'is_multi_year_display',
          valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
        }),
  },
  {
    autoHeight: true,
    cellClass: 'ag-cell-wrap-text',
    field: 'reason_for_exceeding',
    headerClass: 'ag-text-center',
    headerName: 'Reason for Exceeding',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'reason_for_exceeding'),
        }
      : { tooltipField: 'reason_for_exceeding' }),
  },
  {
    autoHeight: true,
    cellClass: 'ag-cell-wrap-text',
    field: 'remarks',
    headerClass: 'ag-text-center',
    headerName: 'Remarks',
    minWidth: 200,
    resizable: true,
    sortable: true,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'remarks'),
        }
      : { tooltipField: 'remarks' }),
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
