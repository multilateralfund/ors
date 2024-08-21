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
              dataType: 'number',
              field: 'previous_year_price',
              headerName: 'Previous year price',
              orsAggFunc: 'sumTotal',
              ...sectionColDefById['previous_year_price'],
            },
          ]
        : []),
      {
        dataType: 'number',
        field: 'current_year_price',
        headerName: 'Current prices',
        orsAggFunc: 'sumTotal',
        ...sectionColDefById['current_year_price'],
      },
      ...(includes(['V'], model)
        ? [
            {
              cellRendererParams: () => {
                return {
                  disabled: true,
                }
              },
              ...sectionColDefById['fob'],
            },
            {
              cellRendererParams: () => {
                return {
                  disabled: true,
                }
              },
              ...sectionColDefById['retail_price'],
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
      // minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
