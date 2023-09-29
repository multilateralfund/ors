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
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'all_uses',
        headerName: 'Captured for all uses',
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'feedstock',
        headerName: 'Captured for feedstock uses within your country',
        initialWidth: 400,
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'destruction',
        headerName: 'Captured for destruction',
        initialWidth: 240,
      },
      {
        field: 'expand',
        flex: 1,
        headerName: '',
      },
    ],
    defaultColDef: {
      autoHeight: true,
      cellClass: 'ag-text-right',
      headerClass: 'ag-text-center',
      minWidth: 200,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
