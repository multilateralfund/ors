import { ColDef } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  all_uses: {
    ...colDefById['all_uses'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
    headerComponentParams: {
      footnote: {
        id: '1',
        content:
          'HFC-23 generation that is captured, whether for destruction, feedstock or any other use, shall be reported in this form',
        icon: false,
        order: 1,
      },
    },
    // initialWidth: 200,
  },
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
}

const sectionDefaultColDef: ColDef<any, any> = {
  autoHeaderHeight: true,
}

export { sectionColDefById, sectionDefaultColDef }
