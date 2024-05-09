import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import { RowData } from './Create/types'

const sectionColDefByIdFunc = (model: string): Record<string, ColDef> => ({
  ...colDefById,
  banned_date: {
    ...colDefById['banned_date'],
    headerComponentParams: {
      footnote: {
        content: 'If imports are banned, indicate date ban commenced',
        icon: false,
        index: '*',
        order: 99,
      },
    },
    headerName: 'Date ban commenced',
    ...(includes(['IV', 'V'], model)
      ? { initialWidth: 100, minWidth: 100 }
      : {}),
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
        ...(props.data?.row_id === 'other-new_substance' &&
        !includes(['V'], model)
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
        icon: false,
      },
    },
  },
  export_quotas: {
    initialWidth: 80,
  },
  exports: {
    ...(includes(['I'], model) ? { maxWidth: 100, minWidth: 100 } : {}),
    headerComponentParams: {
      ...(includes(['II', 'III'], model)
        ? {
            footnote: {
              id: '2',
              content: 'Where applicable.',
              icon: false,
            },
          }
        : {}),
    },
  },
  imports: {
    ...(includes(['I'], model) ? { maxWidth: 100, minWidth: 100 } : {}),
  },
  production: {
    ...(includes(['III'], model) ? { maxWidth: 100, minWidth: 100 } : {}),
    ...(includes(['II'], model) ? { maxWidth: 100, minWidth: 100 } : {}),
    ...(includes(['I'], model) ? { maxWidth: 100, minWidth: 100 } : {}),
    headerComponentParams: {
      ...(includes(['II', 'III'], model)
        ? {
            footnote: {
              id: '2',
              content: 'Where applicable.',
              icon: false,
            },
          }
        : {}),
    },
  },
  remarks: {
    ...colDefById['remarks'],
    ...(includes(['II'], model) ? { maxWidth: 100, minWidth: 100 } : {}),
    headerComponentParams: {
      ...(includes(['II', 'III'], model)
        ? {
            footnote: {
              content: 'e.g., stockpiling if use is different from consumption',
              icon: false,
              index: '**',
              order: 99,
            },
          }
        : {
            footnote: {
              id: includes(['V'], model) ? 2 : 3,
              content:
                'Provide explanation if total sector use and consumption (import-export+production) is different (e.g, stockpiling).',
              icon: false,
            },
          }),
    },
  },
})

export { sectionColDefByIdFunc }
