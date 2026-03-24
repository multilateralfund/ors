import { useState } from 'react'

import { GridOptions } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { sectionColDefByIdFunc } from '../sectionColumnsDef'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'

function useGridOptions(props: { variant: ReportVariant }) {
  const { variant } = props
  const sectionColDefById = sectionColDefByIdFunc(variant)
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
        headerName: variant.match([CPModel.IV]) ? 'Description' : 'Substance',
        ...sectionColDefById['display_name'],
      },
      ...(!variant.match([CPModel.II, CPModel.III])
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
      {
        cellRendererParams: () => {
          return {
            disabled: true,
          }
        },
        ...sectionColDefById['is_fob'],
      },
      {
        cellRendererParams: () => {
          return {
            disabled: true,
          }
        },
        ...sectionColDefById['is_retail'],
      },
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
      cellClass: 'px-0 ag-text-center',
      // minWidth: defaultColDef.minWidth,
      resizable: true,
      wrapText: true,
    },
  })

  return gridOptions
}

export default useGridOptions
