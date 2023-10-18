import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColDef } from '@ors/config/Table/columnsDef'

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
        ...colDefById['display_name'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'all_uses',
        headerName: 'Captured for all uses',
        ...colDefById['all_uses'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'feedstock',
        headerName: 'Captured for feedstock uses within your country',
        ...colDefById['feedstock'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'destruction',
        headerName: 'Captured for destruction',
        ...colDefById['destruction'],
      },
    ],
    defaultColDef: {
      autoHeight: true,
      cellClass: 'ag-text-right',
      headerClass: 'ag-text-center',
      minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
