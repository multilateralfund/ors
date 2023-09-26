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
        field: 'previous_year_price',
        headerName: 'Previous year price',
      },
      {
        aggFunc: 'sum',
        cellRenderer: 'agFloatCellRenderer',
        field: 'current_year_price',
        headerName: 'Current prices',
      },
      {
        field: 'remarks',
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
