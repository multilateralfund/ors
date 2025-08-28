import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  sectionColDefById,
  sectionDefaultColDef,
  sectionColGroupDefById,
} from '../sectionColumnsDef'
import { colDefById } from '@ors/config/Table/columnsDef'

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
        headerName: 'Total production for all uses',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['all_uses'],
      },
      {
        dataType: 'number',
        field: 'feedstock',
        headerName: 'Production for feedstock uses within your country',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['feedstock'],
      },
      {
        children: [
          {
            dataType: 'number',
            field: 'other_uses_quantity',
            headerName: 'Quantity',
            orsAggFunc: 'sumTotal',
          },
          {
            field: 'other_uses_remarks',
            headerName: 'Decision / type of use or remarks',
            ...colDefById['remarks'],
          },
        ],
        groupId: 'other_uses',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName:
          'Production for exempted essential, critical, high-ambient-temperature or other uses within your country',
        marryChildren: true,
        ...sectionColGroupDefById['other_uses'],
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
