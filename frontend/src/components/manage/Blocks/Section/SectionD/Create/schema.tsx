import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'

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
        field: 'display_name',
        headerClass: 'ag-text-left',
        headerName: 'Substance',
        ...sectionColDefById['display_name'],
      },
      {
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'all_uses',
        headerName: 'Total production for all uses',
        ...sectionColDefById['all_uses'],
      },
      {
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'feedstock',
        headerName: 'Production for feedstock uses within your country',
        ...sectionColDefById['feedstock'],
      },
      {
        children: [
          {
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            dataType: 'number',
            field: 'other_uses_quantity',
            headerName: 'Quantity',
            orsAggFunc: 'sumTotal',
          },
          {
            cellEditor: 'agTextCellEditor',
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
