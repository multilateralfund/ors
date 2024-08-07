import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'

import { sectionColDefById, sectionDefaultColDef } from '../sectionColumnsDef'

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
        headerName: 'Captured for all uses',
        ...sectionColDefById['all_uses'],
      },
      {
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'feedstock',
        headerName: 'Captured for feedstock uses within your country',
        ...sectionColDefById['feedstock'],
      },
      {
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        dataType: 'number',
        editable: true,
        field: 'destruction',
        headerName: 'Captured for destruction',
        ...sectionColDefById['destruction'],
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
