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
          footnote: 1,
          info: true,
        }),
        field: 'display_name',
        headerClass: 'ag-text-left',
        headerName: 'Substance',
        ...colDefById['display_name'],
      },
      {
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'all_uses',
        headerComponentParams: {
          footnote: 1,
          info: true,
        },
        headerName: 'Captured for all uses',
        ...colDefById['all_uses'],
      },
      {
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'feedstock',
        headerComponentParams: {
          footnote: 2,
          info: true,
        },
        headerName: 'Captured for feedstock uses within your country',
        ...colDefById['feedstock'],
      },
      {
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'destruction',
        headerComponentParams: {
          footnote: 2,
          info: true,
        },
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
