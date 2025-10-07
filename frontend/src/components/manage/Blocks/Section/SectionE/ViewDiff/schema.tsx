import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import {
  sectionColDefByIdFunc,
  sectionColGroupDefByIdFunc,
} from '../sectionColumnsDef'
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

function useGridOptions(props: { model: string }) {
  const { model } = props
  const sectionColDefById = sectionColDefByIdFunc(model)
  const sectionColGroupDefById = sectionColGroupDefByIdFunc(model)
  const [gridOptions] = useState<GridOptions>({
    columnDefs: [
      {
        ...sectionColDefById['facility'],
        cellClass: 'bg-mui-box-background',
        cellRendererParams: (props: any) => ({
          className: cx('px-0', {
            'font-bold': includes(
              ['group', 'total', 'subtotal'],
              props.data.rowType,
            ),
          }),
        }),
        field: 'facility',
        headerClass: 'ag-text-left',
        headerName: 'Facility name or identifier',
      },
      {
        ...sectionColDefById['total_amount_generated'],
        cellClass: 'bg-white ag-text-center px-0',
        dataType: 'number_diff',
        field: 'total',
        headerName: shouldEnableNewCPDataFormatting(model)
          ? 'Total amount generated (tonnes)'
          : 'Total amount generated',
        orsAggFunc: 'sumTotal',
      },
      ...(shouldEnableNewCPDataFormatting(model)
        ? [
            {
              dataType: 'number_diff',
              cellClass: 'bg-white ag-text-center px-0',
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
            ...sectionColDefById['all_uses'],
            cellClass: 'bg-white ag-text-center px-0',
            dataType: 'number_diff',
            field: 'all_uses',
            headerName: shouldEnableNewCPDataFormatting(model)
              ? 'For uses excluding feedstocks'
              : 'For all uses',
            orsAggFunc: 'sumTotal',
          },
          {
            ...sectionColDefById['feedstock_gc'],
            cellClass: 'bg-white ag-text-center px-0',
            dataType: 'number_diff',
            field: 'feedstock_gc',
            headerName: 'For feedstock use in your country',
            orsAggFunc: 'sumTotal',
          },
          {
            ...sectionColDefById['destruction'],
            cellClass: 'bg-white ag-text-center px-0',
            dataType: 'number_diff',
            field: 'destruction',
            headerName: 'For destruction',
            orsAggFunc: 'sumTotal',
          },
        ],
        groupId: 'amount_generated_and_captured',
        headerGroupComponent: 'agColumnHeaderGroup',
        headerName: shouldEnableNewCPDataFormatting(model)
          ? 'Amount generated and captured (tonnes)'
          : 'Amount generated and captured',
        marryChildren: true,
        ...sectionColGroupDefById['amount_generated_and_captured'],
      },
      {
        ...sectionColDefById['feedstock_wpc'],
        cellClass: 'bg-white ag-text-center px-0',
        dataType: 'number_diff',
        field: 'feedstock_wpc',
        headerName: shouldEnableNewCPDataFormatting(model)
          ? 'Amount used for feedstock without prior capture (tonnes)'
          : 'Amount used for feedstock without prior capture',
        orsAggFunc: 'sumTotal',
      },
      {
        ...sectionColDefById['destruction_wpc'],
        cellClass: 'bg-white ag-text-center px-0',
        dataType: 'number_diff',
        field: 'destruction_wpc',
        headerName: shouldEnableNewCPDataFormatting(model)
          ? 'Amount destroyed in the facility without prior capture (tonnes)'
          : 'Amount destroyed without prior capture',
        orsAggFunc: 'sumTotal',
      },
      {
        ...sectionColDefById['generated_emissions'],
        cellClass: 'bg-white ag-text-center px-0',
        dataType: 'number_diff',
        field: 'generated_emissions',
        headerName: shouldEnableNewCPDataFormatting(model)
          ? 'Amount of generated emissions (tonnes)'
          : 'Amount of generated emissions',
        orsAggFunc: 'sumTotal',
      },
      ...(shouldEnableNewCPDataFormatting(model)
        ? [
            {
              dataType: 'number_diff',
              cellClass: 'bg-white ag-text-center px-0',
              field: 'stored_at_end_of_year',
              headerName: 'Amount stored at the end of the year (tonnes)',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['stored_at_end_of_year'],
            },
          ]
        : []),
      {
        ...sectionColDefById['remarks'],
        cellClass: 'ag-text-left remarks-cell',
        dataType: 'text_diff',
        field: 'remarks',
        headerName: 'Remarks',
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
