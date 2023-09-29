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
        field: 'facility',
        headerClass: 'ag-text-left',
        headerName: 'Facility name or identifier',
        initialWidth: 400,
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'total',
        headerName: 'Total amount generated',
        initialWidth: 240,
      },
      {
        children: [
          {
            aggFunc: 'sumTotal',
            cellRenderer: 'agFloatCellRenderer',
            field: 'all_uses',
            headerName: 'For all uses',
          },
          {
            aggFunc: 'sumTotal',
            cellRenderer: 'agFloatCellRenderer',
            field: 'feedstock_gc',
            headerName: 'For feedstock use in your country',
          },
          {
            aggFunc: 'sumTotal',
            cellRenderer: 'agFloatCellRenderer',
            field: 'destruction',
            headerName: 'For destruction',
          },
        ],
        groupId: 'amount_generated_and_captured',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName: 'Amount generated and captured',
        marryChildren: true,
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'feedstock_wpc',
        headerName: 'Amount used for feedstock without prior capture',
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'destruction_wpc',
        headerName: 'Amount destroyed without prior capture',
      },
      {
        aggFunc: 'sumTotal',
        cellRenderer: 'agFloatCellRenderer',
        field: 'generated_emissions',
        headerName: 'Amount of generated emission',
      },
      {
        field: 'remarks',
        headerName: 'Remarks',
        initialWidth: 300,
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
