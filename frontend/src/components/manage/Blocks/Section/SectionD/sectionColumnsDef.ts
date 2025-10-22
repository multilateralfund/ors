import { ColDef, ColGroupDef } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColGroupDef } from '@ors/config/Table/columnsDef'
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

const sectionColDefByIdFunc = (model: string): Record<string, ColDef> => ({
  ...colDefById,
  all_uses: {
    ...colDefById['all_uses'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
    ...(shouldEnableNewCPDataFormatting(model)
      ? {}
      : {
          headerComponentParams: {
            footnote: {
              id: '1',
              content:
                'HFC-23 generation that is captured, whether for destruction, feedstock or any other use, shall be reported in this form',
              icon: false,
              order: 1,
            },
          },
        }),
    // initialWidth: 200,
  },
  ...(shouldEnableNewCPDataFormatting(model)
    ? {}
    : {
        destruction: {
          ...colDefById['destruction'],
          cellClass: 'ag-text-center',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            footnote: {
              id: '2',
              content:
                'Amounts of HFC-23 captured for destruction or feedstock use will not be counted as production as per Article 1 of the Montreal Protocol.',
              icon: false,
              order: 2,
            },
          },
        },
      }),
  ...(shouldEnableNewCPDataFormatting(model)
    ? {
        display_name: {
          ...colDefById['display_name'],
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(
                ['group', 'total', 'subtotal'],
                props.data.rowType,
              ),
            }),
            footnote: {
              id: '1',
              content: 'Unintentional generation.',
              order: 1,
            },
          }),
        },
      }
    : {
        display_name: {
          ...colDefById['display_name'],
          cellRendererParams: (props: any) => ({
            className: cx({
              'font-bold': includes(
                ['group', 'total', 'subtotal'],
                props.data.rowType,
              ),
            }),
            footnote: {
              id: '1',
              content:
                'HFC-23 generation that is captured, whether for destruction, feedstock or any other use, shall be reported in this form',
              order: 1,
            },
          }),
        },
      }),
  ...(shouldEnableNewCPDataFormatting(model)
    ? {
        feedstock: {
          ...colDefById['feedstock'],
          cellClass: 'ag-text-center',
          headerClass: 'ag-text-center',
        },
      }
    : {
        feedstock: {
          ...colDefById['feedstock'],
          cellClass: 'ag-text-center',
          headerClass: 'ag-text-center',
          headerComponentParams: {
            footnote: {
              id: '2',
              content:
                'Amounts of HFC-23 captured for destruction or feedstock use will not be counted as production as per Article 1 of the Montreal Protocol.',
              icon: false,
              order: 2,
            },
          },
        },
      }),
})

const sectionDefaultColDef: ColDef<any, any> = {
  autoHeaderHeight: true,
}

const sectionColGroupDefById: Record<string, Omit<ColGroupDef, 'children'>> = {
  other_uses: {
    headerGroupComponentParams: {
      ...defaultColGroupDef.headerGroupComponentParams,
      footnote: {
        id: '*',
        content:
          'Against each substance produced for exempted essential, critical, high-ambient-temperature or other uses, please specify the meeting of the parties decision that approved the use.',
        icon: false,
        order: 1,
      },
    },
  },
}

export { sectionColDefByIdFunc, sectionDefaultColDef, sectionColGroupDefById }
