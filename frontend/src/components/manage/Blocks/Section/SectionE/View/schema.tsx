import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { defaultColDef } from '@ors/config/Table/columnsDef'

import { sectionColDefById, sectionColGroupDefById } from '../sectionColumnsDef'

function useGridOptions() {
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        cellClass: 'bg-mui-box-background',
        cellRendererParams: (props: any) => ({
          className: cx({
            'font-bold': includes(['group', 'total'], props.data.rowType),
          }),
        }),
        field: 'facility',
        headerClass: 'ag-text-left',
        headerName: 'Facility name or identifier',
        ...sectionColDefById['facility'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'total',
        headerName: 'Total amount generated',
        ...sectionColDefById['total_amount_generated'],
      },
      {
        children: [
          {
            aggFunc: 'sumTotal',
            dataType: 'number',
            field: 'all_uses',
            headerName: 'For all uses',
            ...sectionColDefById['all_uses'],
          },
          {
            aggFunc: 'sumTotal',
            dataType: 'number',
            field: 'feedstock_gc',
            headerName: 'For feedstock use in your country',
            ...sectionColDefById['feedstock_gc'],
          },
          {
            aggFunc: 'sumTotal',
            dataType: 'number',
            field: 'destruction',
            headerName: 'For destruction',
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
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'feedstock_wpc',
        headerName: 'Amount used for feedstock without prior capture',
        ...sectionColDefById['feedstock_wpc'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'destruction_wpc',
        headerName: 'Amount destroyed without prior capture',
        ...sectionColDefById['destruction_wpc'],
      },
      {
        aggFunc: 'sumTotal',
        dataType: 'number',
        field: 'generated_emissions',
        headerName: 'Amount of generated emission',
        ...sectionColDefById['generated_emissions'],
      },
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
      minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
