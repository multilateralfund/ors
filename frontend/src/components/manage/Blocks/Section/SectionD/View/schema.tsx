import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import { sectionColDefById } from '../sectionColumnsDef'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        cellClass: 'bg-mui-box-background',
        cellRendererParams: (props: any) => ({
          className: cx({
            'font-bold': includes(
              ['group', 'total', 'subtotal'],
              props.data.rowType,
            ),
          }),
        }),
        field: 'display_name',
        headerClass: 'ag-text-left',
        headerName: 'Substance',
        ...sectionColDefById['display_name'],
      },
      {
        dataType: 'number',
        field: 'all_uses',
        headerName: 'Captured for all uses',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['all_uses'],
      },
      {
        dataType: 'number',
        field: 'feedstock',
        headerName: 'Captured for feedstock uses within your country',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['feedstock'],
      },
      {
        dataType: 'number',
        field: 'destruction',
        headerName: 'Captured for destruction',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['destruction'],
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
