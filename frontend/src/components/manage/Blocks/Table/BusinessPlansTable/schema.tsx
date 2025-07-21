import { formatDecimalValue } from '@ors/helpers'
import {
  cellValueGetter,
  numberCellGetter,
  numberCellRenderer,
  objectCellValueGetter,
  substancesDiffCellRenderer,
  tagsCellRenderer,
  textCellRenderer,
} from './schemaHelpers'
import { ITooltipParams } from 'ag-grid-community'
import { tableColumns } from '../../BusinessPlans/constants'

const getDefaultColumnDefs = (isDiff: boolean, withAgency: boolean) => [
  {
    field: 'country.name',
    headerName: tableColumns.country_id,
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
          field: 'agency.name',
          headerName: tableColumns.agency_id,
          minWidth: 110,
          sortable: true,
          tooltipField: 'agency.name',
        },
      ]
    : []),
  {
    field: 'lvc_status',
    headerName: tableColumns.lvc_status,
    minWidth: 90,
    sortable: false,
    tooltipField: 'lvc_status',
  },
  {
    field: 'project_cluster.code',
    headerName: tableColumns.project_cluster_id,
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
    field: 'project_type.code',
    headerName: tableColumns.project_type_id,
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
    field: 'sector.code',
    headerName: tableColumns.sector_id,
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
    field: 'subsector.code',
    headerName: tableColumns.subsector_id,
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
    field: 'title',
    headerName: tableColumns.title,
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
  field: 'required_by_model',
  headerName: tableColumns.required_by_model,
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
  field: 'status',
  headerName: tableColumns.status,
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
  field: 'is_multi_year',
  headerName: tableColumns.is_multi_year,
  minWidth: 100,
  sortable: !isDiff,
  ...(isDiff
    ? {
        cellRenderer: textCellRenderer,
        valueGetter: (params: any) => cellValueGetter(params, 'is_multi_year'),
      }
    : {
        tooltipField: 'is_multi_year_display',
        valueGetter: ({ data }: any) => (data.is_multi_year ? 'M' : 'I'),
      }),
})

const getRemarksColumnsDefs = (isDiff: boolean) => [
  {
    headerName: tableColumns.remarks,
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
]

const valuesColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  yearColumns.find(
    (column: { headerName: string }) => column.headerName === 'Value (US $)',
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
      column.headerName === 'CO2-eq tonnes',
  ) || []),
]

const remarksColumnDefs = (isDiff: boolean, withAgency: boolean) => [
  ...getDefaultColumnDefs(isDiff, withAgency),
  ...getRemarksColumnsDefs(isDiff),
]

const allColumnDefs = (
  yearColumns: any[],
  isDiff: boolean,
  withAgency: boolean,
) => {
  const defaultColDef = getDefaultColumnDefs(isDiff, withAgency)
  return [
    ...defaultColDef.slice(0, 5),
    {
      field: 'bp_chemical_type.name',
      headerName: tableColumns.bp_chemical_type_id,
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
      headerName: tableColumns.substances,
      minWidth: 130,
      sortable: !isDiff,
      ...(isDiff
        ? {
            cellRenderer: substancesDiffCellRenderer,
            valueGetter: (params: any) =>
              cellValueGetter(params, 'substances_display'),
          }
        : { cellRenderer: tagsCellRenderer }),
    },
    {
      cellClass: 'ag-text-center',
      field: 'amount_polyol',
      headerName: tableColumns.amount_polyol,
      minWidth: 120,
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
                : '0.00'
            },
            tooltipValueGetter: (params: ITooltipParams) => {
              const polyolAmount = params.data.amount_polyol

              return polyolAmount
                ? formatDecimalValue(parseFloat(polyolAmount), {
                    maximumFractionDigits: 10,
                    minimumFractionDigits: 2,
                  })
                : '0.00'
            },
          }),
    },
    ...defaultColDef.slice(5),
    getReqByModelColumn(isDiff),
    ...yearColumns,
    getStatusColumn(isDiff),
    getIsMultiYearColumn(isDiff),
    ...getRemarksColumnsDefs(isDiff),
  ]
}

const defaultColDef = {
  headerClass: 'ag-text-center',
  cellClass: 'ag-cell-ellipsed',
  resizable: true,
}

export {
  allColumnDefs,
  remarksColumnDefs,
  defaultColDef,
  odpColumnDefs,
  valuesColumnDefs,
}
