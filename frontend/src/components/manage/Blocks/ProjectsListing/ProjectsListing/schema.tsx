import { useMemo } from 'react'

import { formatDecimalValue } from '@ors/helpers/Utils/Utils'
import { tableColumns } from '../constants'
import { ITooltipParams } from 'ag-grid-community'
import { Checkbox } from '@mui/material'

const formatNumberColumns = (
  params: any,
  field: string,
  valueFormatter?: {},
) => {
  const value = params.data[field]

  return (
    '$' +
    (value
      ? valueFormatter
        ? formatDecimalValue(parseFloat(value), valueFormatter)
        : formatDecimalValue(parseFloat(value))
      : '0.00')
  )
}

const getColumnDefs = () => {
  const gridOptions = useMemo(
    () => ({
      columnDefs: [
        {
          headerName: 'Select',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          sortable: false,
          minWidth: 70,
          cellRenderer: (props: any) => <Checkbox />,
          editable: false,
          field: '',
        },
        {
          headerName: tableColumns.submission_status,
          field: 'submission_status',
          tooltipField: 'submission_status',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 90,
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
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 90,
        },
        {
          headerName: tableColumns.code,
          field: 'code',
          tooltipField: 'code',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 90,
        },
        {
          headerName: tableColumns.cluster,
          field: 'cluster',
          tooltipField: 'cluster',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 70,
        },
        {
          headerName: tableColumns.tranche,
          field: 'tranche',
          tooltipField: 'tranche',
          cellClass: 'ag-text-center ag-cell-ellipsed',
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
          cellClass: 'ag-cell-ellipsed',
          field: 'title',
          headerClass: 'ag-text-center',
          minWidth: 200,
          tooltipField: 'title',
        },
        {
          headerName: tableColumns.type,
          field: 'project_type',
          tooltipField: 'project_type',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 70,
        },
        {
          headerName: tableColumns.sector,
          field: 'sector',
          tooltipField: 'sector',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 70,
        },
        {
          headerName: tableColumns.total_funding,
          field: 'total_funding',
          cellClass: 'ag-text-center ag-cell-ellipsed',
          minWidth: 120,
          valueGetter: (params: any) =>
            formatNumberColumns(params, 'total_funding'),
          tooltipValueGetter: (params: ITooltipParams) =>
            formatNumberColumns(params, 'total_funding', {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            }),
        },
      ],
      defaultColDef: {
        headerClass: 'ag-text-center',
        minWidth: 100,
        resizable: true,
        sortable: true,
      },
    }),
    [],
  )

  return gridOptions
}

export default getColumnDefs
