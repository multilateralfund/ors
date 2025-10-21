import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  sectionColDefByIdFunc,
  sectionColGroupDefById,
  sectionDefaultColDef,
} from '../sectionColumnsDef'
import { colDefById } from '@ors/config/Table/columnsDef'
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

function useGridOptions(props: { model: string }) {
  const { model } = props
  const sectionColDefById = sectionColDefByIdFunc(model)
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
      shouldEnableNewCPDataFormatting(model)
        ? {
            ...sectionColDefById['all_uses'],
            cellClass: 'ag-text-center px-0',
            dataType: 'number_diff',
            field: 'all_uses',
            headerName: 'Total production for all uses',
            orsAggFunc: 'sumTotal',
          }
        : {
            ...sectionColDefById['all_uses'],
            cellClass: 'ag-text-center px-0',
            dataType: 'number_diff',
            field: 'all_uses',
            headerName: 'Captured for all uses',
            orsAggFunc: 'sumTotal',
          },
      shouldEnableNewCPDataFormatting(model)
        ? {
            ...sectionColDefById['feedstock'],
            cellClass: 'ag-text-center px-0',
            dataType: 'number_diff',
            field: 'feedstock',
            headerName: 'Production for feedstock uses within your country',
            orsAggFunc: 'sumTotal',
          }
        : {
            ...sectionColDefById['feedstock'],
            cellClass: 'ag-text-center px-0',
            dataType: 'number_diff',
            field: 'feedstock',
            headerName: 'Captured for feedstock uses within your country',
            orsAggFunc: 'sumTotal',
          },
      shouldEnableNewCPDataFormatting(model)
        ? {
            children: [
              {
                dataType: 'number_diff',
                field: 'other_uses_quantity',
                headerName: 'Quantity',
                orsAggFunc: 'sumTotal',
              },
              {
                field: 'other_uses_remarks',
                headerName: 'Decision / type of use or remarks',
                ...colDefById['remarks'],
                dataType: 'text_diff',
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
