import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefById, sectionDefaultColDef } from '../sectionColumnsDef'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        ...sectionColDefById['display_name'],
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
      },
      {
        ...sectionColDefById['all_uses'],
        cellClass: 'ag-text-center px-0',
        dataType: 'number_diff',
        field: 'all_uses',
        headerName: 'Captured for all uses',
        orsAggFunc: 'sumTotal',
      },
      {
        ...sectionColDefById['feedstock'],
        cellClass: 'ag-text-center px-0',
        dataType: 'number_diff',
        field: 'feedstock',
        headerName: 'Captured for feedstock uses within your country',
        orsAggFunc: 'sumTotal',
      },
      {
        ...sectionColDefById['destruction'],
        cellClass: 'ag-text-center px-0',
        dataType: 'number_diff',
        field: 'destruction',
        headerName: 'Captured for destruction',
        orsAggFunc: 'sumTotal',
      },
    ],
    defaultColDef: {
      ...sectionDefaultColDef,
      autoHeight: true,
      cellClass: 'ag-text-right',
      headerClass: 'ag-text-center',
      // minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
