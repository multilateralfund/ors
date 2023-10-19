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
        field: 'facility',
        headerClass: 'ag-text-left',
        headerName: 'Facility name or identifier',
        ...colDefById['facility'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'total',
        headerName: 'Total amount generated',
        ...colDefById['total_amount_generated'],
      },
      {
        children: [
          {
            aggFunc: 'sumTotal',
            dataType: 'number',
            field: 'all_uses',
            headerName: 'For all uses',
            ...colDefById['all_uses'],
          },
          {
            aggFunc: 'sumTotal',
            dataType: 'number',
            field: 'feedstock_gc',
            headerName: 'For feedstock use in your country',
            ...colDefById['feedstock_gc'],
          },
          {
            aggFunc: 'sumTotal',
            dataType: 'number',
            field: 'destruction',
            headerName: 'For destruction',
            ...colDefById['destruction'],
          },
        ],
        groupId: 'amount_generated_and_captured',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName: 'Amount generated and captured',
        marryChildren: true,
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'feedstock_wpc',
        headerName: 'Amount used for feedstock without prior capture',
        ...colDefById['feedstock_wpc'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'destruction_wpc',
        headerName: 'Amount destroyed without prior capture',
        ...colDefById['destruction_wpc'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'generated_emissions',
        headerName: 'Amount of generated emission',
        ...colDefById['generated_emissions'],
      },
      {
        field: 'remarks',
        headerName: 'Remarks',
        ...colDefById['remarks'],
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
