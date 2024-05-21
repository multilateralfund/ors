import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefByIdFunc } from '../sectionColumnsDef'

function useGridOptions(props: { model: string }) {
  const { model } = props
  const sectionColDefById = sectionColDefByIdFunc(model)
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
        headerName: includes(['IV'], model) ? 'Description' : 'Substance',
        ...sectionColDefById['display_name'],
      },
      ...(!includes(['II', 'III'], model)
        ? [
            {
              ...sectionColDefById['previous_year_price'],
              cellClass: 'px-0 ag-text-center',
              dataType: 'number_diff',
              field: 'previous_year_price',
              headerName: 'Previous year price',
              orsAggFunc: 'sumTotal',
            },
          ]
        : []),
      {
        ...sectionColDefById['current_year_price'],
        cellClass: 'px-0 ag-text-center',
        dataType: 'number_diff',
        field: 'current_year_price',
        headerName: 'Current prices',
        orsAggFunc: 'sumTotal',
      },
    ],
    defaultColDef: {
      autoHeight: true,
      cellClass: 'px-0 ag-text-center',
      // minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
