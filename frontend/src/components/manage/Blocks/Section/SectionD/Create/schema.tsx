import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'

import {
  sectionColDefByIdFunc,
  sectionDefaultColDef,
  sectionColGroupDefById,
} from '../sectionColumnsDef'
import { colDefById } from '@ors/config/Table/columnsDef'
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

function useGridOptions(props: { model: string }) {
  const { model } = props
  const sectionColDefById = sectionColDefByIdFunc(model)
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        cellClass: 'bg-mui-box-background',
        field: 'display_name',
        headerClass: 'ag-text-left',
        headerName: 'Substance',
        ...sectionColDefById['display_name'],
      },
      shouldEnableNewCPDataFormatting(model)
        ? {
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            dataType: 'number',
            editable: true,
            field: 'all_uses',
            headerName: 'Total production for all uses',
            ...sectionColDefById['all_uses'],
          }
        : {
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            dataType: 'number',
            editable: true,
            field: 'all_uses',
            headerName: 'Captured for all uses',
            ...sectionColDefById['all_uses'],
          },
      shouldEnableNewCPDataFormatting(model)
        ? {
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            dataType: 'number',
            editable: true,
            field: 'feedstock',
            headerName: 'Production for feedstock uses within your country',
            ...sectionColDefById['feedstock'],
          }
        : {
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            dataType: 'number',
            editable: true,
            field: 'feedstock',
            headerName: 'Captured for feedstock uses within your country',
            ...sectionColDefById['feedstock'],
          },
      shouldEnableNewCPDataFormatting(model)
        ? {
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
                ...sectionColDefById['other_uses_remarks'],
              },
            ],
            groupId: 'other_uses',
            headerGroupComponent: 'agColumnHeaderGroup',
            headerName:
              'Production for exempted essential, critical, high-ambient-temperature or other uses within your country',
            marryChildren: true,
            ...sectionColGroupDefById['other_uses'],
          }
        : {
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
