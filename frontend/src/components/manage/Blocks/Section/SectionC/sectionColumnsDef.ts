import { ColDef } from 'ag-grid-community'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefByIdFunc = (model: string): Record<string, ColDef> => ({
  ...colDefById,
  current_year_price: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  display_name: {
    ...colDefById['display_name'],
    initialWidth: Math.floor(
      (colDefById['display_name']?.initialWidth || 130) * 1.5,
    ),
  },
  previous_year_price: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  remarks: {
    ...colDefById['remarks'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
    headerComponentParams: {
      ...(includes(['II', 'III'], model)
        ? {}
        : {
            footnote: {
              id: '1',
              content: 'Indicate whether the prices are FOB or retail prices.',
              icon: false,
            },
          }),
    },
  },
})

export { sectionColDefByIdFunc }
