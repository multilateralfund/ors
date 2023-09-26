/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        field: 'chemical_name',
        headerName: 'Substance',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'all_uses',
        headerName: 'Captured for all uses',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'feedstock',
        headerName: 'Captured for feedstock uses within your country',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'destruction',
        headerName: 'Captured for destruction',
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
