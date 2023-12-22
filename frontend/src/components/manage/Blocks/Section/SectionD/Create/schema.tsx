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
          footnote: {
            id: '1',
            content:
              'HFC-23 generation that is captured, whether for destruction, feedstock or any other use, shall be reported in this form',
            order: 1,
          },
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
          footnote: {
            id: '1',
            content:
              'HFC-23 generation that is captured, whether for destruction, feedstock or any other use, shall be reported in this form',
            icon: true,
            order: 1,
          },
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
          footnote: {
            id: '2',
            content:
              'Amounts of HFC-23 captured for destruction or feedstock use will not be counted as production as per Article 1 of the Montreal Protocol.',
            icon: true,
            order: 2,
          },
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
          footnote: {
            id: '2',
            content:
              'Amounts of HFC-23 captured for destruction or feedstock use will not be counted as production as per Article 1 of the Montreal Protocol.',
            icon: true,
            order: 2,
          },
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
