import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        cellClass: 'bg-mui-box-background',
        cellRendererParams: (props: any) => ({
          className: cx({
            'font-bold': props.data.isGroup || props.data.isTotal,
          }),
        }),
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
