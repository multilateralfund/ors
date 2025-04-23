import { useMemo } from 'react'

import { tableColumns } from '../constants'
import { formatNumberColumns } from '../utils'

import { Checkbox } from '@mui/material'
import { ITooltipParams } from 'ag-grid-community'

const getColumnDefs = () =>
  useMemo(
    () => ({
      columnDefs: [
        {
          headerName: 'Select',
          field: '',
          cellClass: 'ag-text-center',
          sortable: false,
          minWidth: 70,
          cellRenderer: () => (
            <Checkbox
              sx={{
                color: 'black',
              }}
            />
          ),
        },
        {
          headerName: tableColumns.submission_status,
          field: 'submission_status',
          tooltipField: 'submission_status',
        },
        {
          headerName: tableColumns.status,
          field: 'status',
          tooltipField: 'status',
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          minWidth: 120,
        },
        {
          headerName: tableColumns.country,
          field: 'country',
          tooltipField: 'country',
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          minWidth: 150,
        },
        {
          headerName: tableColumns.metacode,
          field: 'metaproject_code',
          tooltipField: 'metaproject_code',
        },
        {
          headerName: tableColumns.code,
          field: 'code',
          tooltipField: 'code',
        },
        {
          headerName: tableColumns.cluster,
          field: 'cluster.code',
          tooltipField: 'cluster.name',
        },
        {
          headerName: tableColumns.tranche,
          field: 'tranche',
          tooltipField: 'tranche',
          minWidth: 70,
        },
        {
          headerName: tableColumns.agency,
          field: 'agency',
          tooltipField: 'agency',
          cellClass: 'ag-text-center ag-cell-ellipsed ag-cell-centered',
          minWidth: 110,
        },
        {
          headerName: tableColumns.title,
          field: 'title',
          tooltipField: 'title',
          cellClass: 'ag-cell-ellipsed',
          minWidth: 300,
        },
        {
          headerName: tableColumns.type,
          field: 'project_type.code',
          tooltipField: 'project_type.name',
        },
        {
          headerName: tableColumns.sector,
          field: 'sector.code',
          tooltipField: 'sector.name',
        },
        {
          headerName: tableColumns.total_fund,
          field: 'total_fund',
          minWidth: 120,
          valueGetter: (params: any) =>
            formatNumberColumns(params, 'total_fund'),
          tooltipValueGetter: (params: ITooltipParams) =>
            formatNumberColumns(params, 'total_fund', {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            }),
        },
      ],
      defaultColDef: {
        headerClass: 'ag-text-center',
        cellClass: 'ag-text-center ag-cell-ellipsed',
        minWidth: 90,
        resizable: true,
        sortable: true,
      },
    }),
    [],
  )

export default getColumnDefs
