/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
