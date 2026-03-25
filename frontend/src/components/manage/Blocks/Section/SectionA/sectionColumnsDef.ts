import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes, startsWith } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import { SectionARowData } from './types'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'

const sectionColDefByIdFunc = (
  variant: ReportVariant,
): Record<string, ColDef> => ({
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
    // ...(variant.match([CPModel.IV, CPModel.V, CPModel.VI])
    //   ? { initialWidth: 100, minWidth: 100 }
    //   : {}),
  },
  display_name: {
    ...colDefById['display_name'],
    cellRendererParams: (props: ICellRendererParams<SectionARowData>) => {
      return {
        className: cx({
          'font-bold': includes(
            ['group', 'total', 'subtotal'],
            props.data?.rowType,
          ),
        }),
        ...(props.data?.row_id === 'other-new_substance' &&
        !variant.match([CPModel.V, CPModel.VI])
          ? {
              footnote: {
                id: variant.match([CPModel.II, CPModel.III]) ? '3' : '2',
                content: 'Indicate relevant controlled substances.',
                icon: true,
              },
            }
          : {}),
        ...(props.data?.rowType === 'group' &&
        startsWith(props.data.display_name, 'Annex C')
          ? {
              footnote: {
                id: '8',
                content:
                  'When report on Blends, where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately.',
                icon: false,
                index: '**',
                order: 999,
              },
            }
          : {}),
      }
    },
    headerComponentParams: {
      footnote: {
        id: '1',
        content: variant.match([CPModel.II])
          ? 'Where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately, e.g.: For R502 consisting of 51.2% CFC-115 and 48.8% HCFC-22, indicate the total quantity of each controlled substance (i.e.., CFC-115 and HCFC-22) in the appropriate row.'
          : 'Where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately.',
        icon: false,
      },
    },
  },
  export_quotas: {
    // initialWidth: 80,
  },
  exports: {
    // ...(variant.match([CPModel.I]) ? { maxWidth: 100, minWidth: 100 } : {}),
    headerComponentParams: {
      ...(variant.match([CPModel.II, CPModel.III])
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
    // ...(variant.match([CPModel.I]) ? { maxWidth: 100, minWidth: 100 } : {}),
  },
  production: {
    // ...(variant.match([CPModel.III]) ? { maxWidth: 100, minWidth: 100 } : {}),
    // ...(variant.match([CPModel.II]) ? { maxWidth: 100, minWidth: 100 } : {}),
    // ...(variant.match([CPModel.I]) ? { maxWidth: 100, minWidth: 100 } : {}),
    headerComponentParams: {
      ...(variant.match([CPModel.II, CPModel.III])
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
    // ...(variant.match([CPModel.II]) ? { maxWidth: 100, minWidth: 100 } : {}),
    headerComponentParams: {
      ...(variant.match([CPModel.II, CPModel.III])
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
              id: variant.match([CPModel.V, CPModel.VI]) ? 2 : 3,
              content:
                'Provide explanation if total sector use and consumption (import-export+production) is different (e.g, stockpiling).',
              icon: false,
            },
          }),
    },
  },
})

export { sectionColDefByIdFunc }
