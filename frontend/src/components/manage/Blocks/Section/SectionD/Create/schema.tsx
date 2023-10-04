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
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        editable: true,
        field: 'all_uses',
        headerComponentParams: { footnote: 2 },
        headerName: 'Captured for all uses',
      },
      {
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        editable: true,
        field: 'feedstock',
        headerComponentParams: { footnote: 3 },
        headerName: 'Captured for feedstock uses within your country',
        initialWidth: 400,
      },
      {
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          min: '0',
        },
        cellRenderer: 'agFloatCellRenderer',
        editable: true,
        field: 'destruction',
        headerName: 'Captured for destruction',
        initialWidth: 240,
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
