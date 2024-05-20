import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefById, sectionColGroupDefById } from '../sectionColumnsDef'

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
        field: 'facility',
        headerClass: 'ag-text-left',
        headerName: 'Facility name or identifier',
        ...sectionColDefById['facility'],
      },
      {
        dataType: 'number_diff',
        field: 'total',
        headerName: 'Total amount generated',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['total_amount_generated'],
      },
      {
        children: [
          {
            dataType: 'number_diff',
            field: 'all_uses',
            headerName: 'For all uses',
            orsAggFunc: 'sumTotal',
            ...sectionColDefById['all_uses'],
          },
          {
            dataType: 'number_diff',
            field: 'feedstock_gc',
            headerName: 'For feedstock use in your country',
            orsAggFunc: 'sumTotal',
            ...sectionColDefById['feedstock_gc'],
          },
          {
            dataType: 'number_diff',
            field: 'destruction',
            headerName: 'For destruction',
            orsAggFunc: 'sumTotal',
            ...sectionColDefById['destruction'],
          },
        ],
        groupId: 'amount_generated_and_captured',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName: 'Amount generated and captured',
        marryChildren: true,
        ...sectionColGroupDefById['amount_generated_and_captured'],
      },
      {
        dataType: 'number_diff',
        field: 'feedstock_wpc',
        headerName: 'Amount used for feedstock without prior capture',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['feedstock_wpc'],
      },
      {
        dataType: 'number_diff',
        field: 'destruction_wpc',
        headerName: 'Amount destroyed without prior capture',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['destruction_wpc'],
      },
      {
        dataType: 'number_diff',
        field: 'generated_emissions',
        headerName: 'Amount of generated emissions',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['generated_emissions'],
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
