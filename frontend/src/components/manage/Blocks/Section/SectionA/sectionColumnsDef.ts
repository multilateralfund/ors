import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import { RowData } from './Create/Create'

const sectionColDefByIdFunc = (model: string): Record<string, ColDef> => ({
  ...colDefById,
  banned_date: {
    ...colDefById['banned_date'],
    headerComponentParams: {
      footnote: {
        content: 'If imports are banned, indicate date ban commenced',
        icon: true,
        index: '*',
        order: 99,
      },
    },
    headerName: 'Date ban commenced',
  },
  display_name: {
    ...colDefById['display_name'],
    cellRendererParams: (props: ICellRendererParams<RowData>) => {
      return {
        className: cx({
          'font-bold': includes(
            ['group', 'total', 'subtotal'],
            props.data?.rowType,
          ),
        }),
        ...(props.data?.row_id === 'other-new_substance'
          ? {
              footnote: {
                id: includes(['II', 'III'], model) ? '3' : '2',
                content: 'Indicate relevant controlled substances.',
                icon: true,
              },
            }
          : {}),
      }
    },
    headerComponentParams: {
      footnote: {
        id: '1',
        content: includes(['II'], model)
          ? 'Where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately, e.g.: For R502 consisting of 51.2% CFC-115 and 48.8% HCFC-22, indicate the total quantity of each controlled substance (i.e.., CFC-115 and HCFC-22) in the appropriate row.'
          : 'Where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately.',
        icon: true,
      },
    },
    initialWidth: 150,
  },
  export_quotas: {
    initialWidth: 80,
  },
  exports: {
    headerComponentParams: {
      footnote: {
        id: '2',
        content: 'Where applicable.',
        icon: true,
      },
    },
  },
  production: {
    headerComponentParams: {
      footnote: {
        id: '2',
        content: 'Where applicable.',
        icon: true,
      },
    },
  },
  remarks: {
    ...colDefById['remarks'],
    headerComponentParams: {
      footnote: {
        content: 'e.g., stockpiling if use is different from consumption',
        icon: true,
        index: includes(['II'], model) ? '**' : '*',
        order: 99,
      },
    },
  },
})

export { sectionColDefByIdFunc }
