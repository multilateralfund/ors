import { pcrTableColumns } from './constants'

import dayjs from 'dayjs'
import { ValueFormatterParams } from 'ag-grid-community'

const getColumnDefs = () => ({
  columnDefs: [
    {
      headerName: pcrTableColumns.project_metacode,
      field: 'project_metacode',
      tooltipField: 'project_metacode',
      minWidth: 150,
    },
    {
      headerName: pcrTableColumns.country,
      field: 'country',
      tooltipField: 'country',
      minWidth: 150,
    },
    {
      headerName: pcrTableColumns.lead_agency,
      field: 'lead_agency',
      tooltipField: 'lead_agency',
      minWidth: 150,
    },
    {
      headerName: pcrTableColumns.cluster,
      field: 'cluster',
      tooltipField: 'cluster',
      minWidth: 130,
    },
    {
      headerName: pcrTableColumns.type,
      field: 'type',
      tooltipField: 'type',
      minWidth: 130,
    },
    {
      headerName: pcrTableColumns.sector,
      field: 'sector',
      tooltipField: 'sector',
      minWidth: 130,
    },
    {
      headerName: pcrTableColumns.subsector,
      field: 'subsector',
      tooltipField: 'subsector',
      minWidth: 160,
    },
    {
      headerName: pcrTableColumns.title,
      field: 'title',
      tooltipField: 'title',
      minWidth: 260,
      cellClass: 'ag-cell-ellipsed',
    },
    {
      headerName: pcrTableColumns.pcr_submission_date,
      field: 'pcr_submission_date',
      tooltipField: 'pcr_submission_date',
      minWidth: 170,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '',
    },
  ],
  defaultColDef: {
    headerClass: 'ag-text-center',
    cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
    minWidth: 90,
    resizable: true,
    sortable: true,
  },
})

export default getColumnDefs
