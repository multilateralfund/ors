import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        field: 'facility',
        headerClass: 'ag-text-center',
        headerName: 'Facility name or identifier',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'total',
        headerClass: 'ag-text-center',
        headerName: 'Total amount generated',
      },
      {
        children: [
          {
            aggFunc: 'sum',
            cellRenderer: 'agFloatCellRenderer',
            field: 'all_uses',
            headerClass: 'ag-text-center',
            headerName: 'For all uses',
          },
          {
            aggFunc: 'sum',
            cellRenderer: 'agFloatCellRenderer',
            field: 'feedstock_gc',
            headerClass: 'ag-text-center',
            headerName: 'For feedstock use in your country',
          },
          {
            aggFunc: 'sum',
            cellRenderer: 'agFloatCellRenderer',
            field: 'destruction',
            headerClass: 'ag-text-center',
            headerName: 'For destruction',
          },
        ],
        groupId: 'amount_generated_and_captured',
        headerClass: 'ag-text-center',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName: 'Amount generated and captured',
        marryChildren: true,
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'feedstock_wpc',
        headerClass: 'ag-text-center',
        headerName: 'Amount used for feedstock without prior capture',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'destruction_wpc',
        headerClass: 'ag-text-center',
        headerName: 'Amount destroyed without prior capture',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'generated_emissions',
        headerClass: 'ag-text-center',
        headerName: 'Amount of generated emission',
      },
      {
        field: 'remarks',
        headerClass: 'ag-text-center',
        headerName: 'Remarks',
      },
    ],
    defaultColDef: {
      flex: 1,
      minWidth: 200,
      resizable: true,
    },
  })

  return gridOptions
}

export default useGridOptions
