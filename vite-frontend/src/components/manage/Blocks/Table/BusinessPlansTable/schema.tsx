import {
  cellValueGetter,
  commentsCellRenderer,
  commentsDiffCellRenderer,
  commentsDiffValueGetter,
  commentsValueGetter,
  numberCellGetter,
  numberCellRenderer,
  objectCellValueGetter,
  substancesDiffCellRenderer,
  tagsCellRenderer,
  textCellRenderer,
} from './schemaHelpers'

const getDefaultColumnDefs = (isDiff: boolean, withAgency: boolean) => [
  {
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
    field: 'country.name',
    headerClass: 'ag-text-center',
    headerName: 'Country',
    minWidth: 150,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'country'),
        }
      : { tooltipField: 'country.name' }),
  },
  ...(withAgency
    ? [
        {
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          field: 'agency',
          headerClass: 'ag-text-center',
          headerName: 'Agency',
          minWidth: 110,
          sortable: true,
          tooltipField: 'agency',
        },
      ]
    : []),
  {
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'project_cluster.code',
    headerClass: 'ag-text-center',
    headerName: 'Cluster',
    minWidth: 70,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'project_cluster'),
        }
      : { tooltipField: 'project_cluster.name' }),
  },
  {
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'project_type.code',
    headerClass: 'ag-text-center',
    headerName: 'Type',
    minWidth: 70,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'project_type'),
        }
      : { tooltipField: 'project_type.name' }),
  },
  {
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'bp_chemical_type.name',
    headerClass: 'ag-text-center',
    headerName: 'Chemical type',
    minWidth: 100,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'bp_chemical_type'),
        }
      : { tooltipField: 'bp_chemical_type.name' }),
  },
  {
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'sector.code',
    headerClass: 'ag-text-center',
    headerName: 'Sector',
    minWidth: 70,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => objectCellValueGetter(params, 'sector'),
        }
      : { tooltipField: 'sector.name' }),
  },
  {
    cellClass: 'ag-text-center ag-cell-wrap-text',
    field: 'subsector.code',
    headerClass: 'ag-text-center',
    headerName: 'Subsector',
    minWidth: 100,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            objectCellValueGetter(params, 'subsector'),
        }
      : { tooltipField: 'subsector.name' }),
  },
  {
    // cellRenderer: (params: any) => (
    //   <Link href={`/business-plans/${params.data.id}`}>
    //     {params.data.title}
    //   </Link>
    // ),
    cellClass: 'ag-cell-ellipsed',
    field: 'title',
    headerClass: 'ag-text-center',
    headerName: 'Title',
    minWidth: 200,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'title'),
        }
      : { tooltipField: 'title' }),
  },
]

const getReqByModelColumn = (isDiff: boolean) => {
  return {
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
    field: 'required_by_model',
    headerClass: 'ag-text-center',
    headerName: 'Required by model',
    minWidth: 150,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'required_by_model'),
        }
      : { tooltipField: 'required_by_model' }),
  }
}

const getCommentsColumnsDefs = (isDiff: boolean) => [
  {
    cellClass: 'ag-cell-ellipsed',
    field: 'reason_for_exceeding',
    headerClass: 'ag-text-center',
    headerName: 'Reason for Exceeding',
    minWidth: 200,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'reason_for_exceeding'),
        }
      : { tooltipField: 'reason_for_exceeding' }),
  },
  {
    cellClass: 'ag-cell-ellipsed',
    headerClass: 'ag-text-center',
    headerName: 'Remarks',
    minWidth: 200,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'remarks'),
        }
      : {
          tooltipField: 'remarks',
          valueGetter: (params: any) => params.data.remarks,
        }),
  },
  {
    cellClass: 'ag-text-center',
    field: 'comment_secretariat',
    headerClass: 'ag-text-center',
    headerName: 'Comment',
    minWidth: 200,
    sortable: !isDiff,
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

const valuesColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  getReqByModelColumn(isDiff),
  yearColumns.find(
    (column: { headerName: string }) => column.headerName === 'Value ($000)',
  ) || [],
  {
    cellClass: 'ag-text-center',
    field: 'status_display',
    headerClass: 'ag-text-center',
    headerName: 'Status',
    minWidth: 100,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'status'),
        }
      : { tooltipField: 'status_display' }),
  },
  {
    cellClass: 'ag-text-center',
    field: 'is_multi_year',
    headerClass: 'ag-text-center',
    headerName: 'IND/MYA',
    minWidth: 100,
    sortable: !isDiff,
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

const odpColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  getReqByModelColumn(isDiff),
  ...(yearColumns.filter(
    (column: { headerName: string }) =>
      column.headerName === 'ODP' || column.headerName === 'MT for HFC',
  ) || []),
]

const commentsColumnDefs = (isDiff: boolean, withAgency: boolean) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  getReqByModelColumn(isDiff),
  ...getCommentsColumnsDefs(isDiff),
]

const allColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  {
    cellClass: !isDiff && 'ag-tags-cell-content',
    field: 'substances_display',
    headerClass: 'ag-text-center',
    headerName: 'Substances',
    minWidth: 230,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: substancesDiffCellRenderer,
          valueGetter: (params: any) =>
            cellValueGetter(params, 'substances_display'),
        }
      : { cellRenderer: tagsCellRenderer }),
  },
  getReqByModelColumn(isDiff),
  {
    cellClass: 'ag-text-center',
    field: 'amount_polyol',
    headerClass: 'ag-text-center',
    headerName: 'Polyol Amount',
    minWidth: 100,
    sortable: !isDiff,
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
    cellClass: 'ag-text-center',
    field: 'status',
    headerClass: 'ag-text-center',
    headerName: 'Status',
    minWidth: 100,
    sortable: !isDiff,
    ...(isDiff
      ? {
          cellRenderer: textCellRenderer,
          valueGetter: (params: any) => cellValueGetter(params, 'status'),
        }
      : { tooltipField: 'status_display' }),
  },
  {
    cellClass: 'ag-text-center',
    field: 'is_multi_year',
    headerClass: 'ag-text-center',
    headerName: 'IND/MYA',
    minWidth: 100,
    sortable: !isDiff,
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
  ...getCommentsColumnsDefs(isDiff),
]

const defaultColDef = {
  autoHeight: true,
  resizable: true,
}

export {
  allColumnDefs,
  commentsColumnDefs,
  defaultColDef,
  odpColumnDefs,
  valuesColumnDefs,
}
