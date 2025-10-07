import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  sectionColDefByIdFunc,
  sectionColGroupDefByIdFunc,
} from '../sectionColumnsDef'

function useGridOptions(props: { model: string }) {
  const { model } = props
  const sectionColDefById = sectionColDefByIdFunc(model)
  const sectionColGroupDefById = sectionColGroupDefByIdFunc(model)
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
        field: 'facility',
        headerClass: 'ag-text-left',
        headerName: 'Facility name or identifier',
        ...sectionColDefById['facility'],
      },
      {
        dataType: 'number',
        field: 'total',
        headerName:
          model === 'V'
            ? 'Total amount generated (tonnes)'
            : 'Total amount generated',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['total_amount_generated'],
      },
      ...(model === 'V'
        ? [
            {
              dataType: 'number',
              field: 'stored_at_start_of_year',
              headerName: 'Amount stored at the beginning of the year (tonnes)',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['stored_at_start_of_year'],
            },
          ]
        : []),
      {
        children: [
          {
            dataType: 'number',
            field: 'all_uses',
            headerName: 'For uses excluding feedstocks',
            orsAggFunc: 'sumTotal',
            ...sectionColDefById['all_uses'],
          },
          {
            dataType: 'number',
            field: 'feedstock_gc',
            headerName:
              model === 'V'
                ? 'For feedstock use in your country'
                : 'For all uses',
            orsAggFunc: 'sumTotal',
            ...sectionColDefById['feedstock_gc'],
          },
          {
            dataType: 'number',
            field: 'destruction',
            headerName: 'For destruction',
            orsAggFunc: 'sumTotal',
            ...sectionColDefById['destruction'],
          },
        ],
        groupId: 'amount_generated_and_captured',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName:
          model === 'V'
            ? 'Amount generated and captured (tonnes)'
            : 'Amount generated and captured',
        marryChildren: true,
        ...sectionColGroupDefById['amount_generated_and_captured'],
      },
      {
        dataType: 'number',
        field: 'feedstock_wpc',
        headerName:
          model === 'V'
            ? 'Amount used for feedstock without prior capture (tonnes)'
            : 'Amount used for feedstock without prior capture',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['feedstock_wpc'],
      },
      {
        dataType: 'number',
        field: 'destruction_wpc',
        headerName:
          model === 'V'
            ? 'Amount destroyed in the facility without prior capture (tonnes)'
            : 'Amount destroyed without prior capture',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['destruction_wpc'],
      },
      {
        dataType: 'number',
        field: 'generated_emissions',
        headerName:
          model === 'V'
            ? 'Amount of generated emissions (tonnes)'
            : 'Amount of generated emissions',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['generated_emissions'],
      },
      ...(model === 'V'
        ? [
            {
              cellDataType: 'number',
              cellEditor: 'agNumberCellEditor',
              dataType: 'number',
              field: 'stored_at_end_of_year',
              headerName: 'Amount stored at the end of the year (tonnes)',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['stored_at_end_of_year'],
            },
          ]
        : []),
      {
        field: 'remarks',
        headerName: 'Remarks',
        ...sectionColDefById['remarks'],
      },
    ],
    defaultColDef: {
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
