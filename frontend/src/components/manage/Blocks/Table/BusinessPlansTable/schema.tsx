import { formatDecimalValue } from '@ors/helpers'
import {
  cellValueGetter,
  commentsDiffCellRenderer,
  commentsDiffValueGetter,
  numberCellGetter,
  numberCellRenderer,
  objectCellValueGetter,
  substancesDiffCellRenderer,
  tagsCellRenderer,
  textCellRenderer,
} from './schemaHelpers'
import { ITooltipParams } from 'ag-grid-community'

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
          field: 'agency.name',
          headerClass: 'ag-text-center',
          headerName: 'Agency',
          minWidth: 110,
          sortable: true,
          tooltipField: 'agency.name',
        },
      ]
    : []),
  {
    cellClass: 'ag-text-center ag-cell-ellipsed',
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
      : {
          tooltipField: 'project_cluster.name',
          valueGetter: (params: any) =>
            params.data.project_cluster?.code ??
            params.data.project_cluster?.name,
        }),
  },
  {
    cellClass: 'ag-text-center ag-cell-ellipsed',
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
      : {
          tooltipField: 'project_type.name',
          valueGetter: (params: any) =>
            params.data.project_type?.code ?? params.data.project_type?.name,
        }),
  },
  {
    cellClass: 'ag-text-center ag-cell-ellipsed',
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
      : {
          tooltipField: 'sector.name',
          valueGetter: (params: any) =>
            params.data.sector?.code ?? params.data.sector?.name,
        }),
  },
  {
    cellClass: 'ag-text-center ag-cell-ellipsed',
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
      : {
          tooltipField: 'subsector.name',
          valueGetter: (params: any) =>
            params.data.subsector?.code ?? params.data.subsector?.name,
        }),
  },
  {
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

const getReqByModelColumn = (isDiff: boolean) => ({
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
})

const getStatusColumn = (isDiff: boolean) => ({
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
})

const getIsMultiYearColumn = (isDiff: boolean) => ({
  cellClass: 'ag-text-center',
  field: 'is_multi_year',
  headerClass: 'ag-text-center',
  headerName: 'IND/MYA',
  minWidth: 100,
  sortable: !isDiff,
  ...(isDiff
    ? {
        cellRenderer: textCellRenderer,
        valueGetter: (params: any) => cellValueGetter(params, 'is_multi_year'),
      }
    : {
        tooltipField: 'is_multi_year_display',
        valueGetter: ({ data }: any) => (data.is_multi_year ? 'MYA' : 'IND'),
      }),
})

const getCommentsColumnsDefs = (isDiff: boolean) => [
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
    cellClass: 'ag-cell-ellipsed',
    field: 'remarks_additional',
    headerClass: 'ag-text-center',
    headerName: 'Remarks (Additional)',
    minWidth: 200,
    sortable: true,
    tooltipField: 'remarks_additional',
  },
  {
    cellClass: 'ag-cell-ellipsed',
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
          tooltipField: 'comment_secretariat',
        }),
  },
]

const valuesColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  yearColumns.find(
    (column: { headerName: string }) => column.headerName === 'Value ($000)',
  ) || [],
  getStatusColumn(isDiff),
  getIsMultiYearColumn(isDiff),
]

const odpColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  ...(yearColumns.filter(
    (column: { headerName: string }) =>
      column.headerName === 'ODP' ||
      column.headerName === 'MT for HFC' ||
      column.headerName === 'CO2-EQ',
  ) || []),
]

const commentsColumnDefs = (isDiff: boolean, withAgency: boolean) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  ...getCommentsColumnsDefs(isDiff),
]

const allColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  {
    cellClass: 'ag-text-center ag-cell-ellipsed',
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

            return polyolAmount
              ? formatDecimalValue(parseFloat(polyolAmount))
              : null
          },
          tooltipValueGetter: (params: ITooltipParams) => {
            const polyolAmount = params.data.amount_polyol

            return polyolAmount
              ? formatDecimalValue(parseFloat(polyolAmount), {
                  maximumFractionDigits: 10,
                  minimumFractionDigits: 2,
                })
              : null
          },
        }),
  },
  ...yearColumns,
  getStatusColumn(isDiff),
  getIsMultiYearColumn(isDiff),
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
