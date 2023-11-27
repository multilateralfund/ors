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
        field: 'previous_year_price',
        headerName: 'Previous year price',
        ...colDefById['previous_year_price'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'current_year_price',
        headerName: 'Current year prices',
        ...colDefById['current_year_price'],
      },
      {
        field: 'remarks',
        headerName: 'Remarks',
        ...colDefById['remarks'],
      },
    ],
    defaultColDef: {
      autoHeight: true,
      minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
