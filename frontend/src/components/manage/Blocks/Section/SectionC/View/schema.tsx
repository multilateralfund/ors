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
      ...(variant.match([CPModel.V, CPModel.VI])
        ? [
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
