import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        cellClass: 'bg-mui-box-background',
        cellRendererParams: (props: any) => ({
          className: cx({
            'font-bold': includes(['group', 'total'], props.data.rowType),
          }),
        }),
        field: 'display_name',
        headerClass: 'ag-text-left',
        headerName: 'Substance',
        minWidth: 300,
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'previous_year_price',
        headerName: 'Previous year price',
      },
      {
        aggFunc: 'sumTotal',
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
      autoHeight: true,
      minWidth: 200,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
