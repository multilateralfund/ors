import { ColDef } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  all_uses: {
    ...colDefById['all_uses'],
    headerComponentParams: {
      footnote: {
        id: '1',
        content:
          'HFC-23 generation that is captured, whether for destruction, feedstock or any other use, shall be reported in this form',
        icon: true,
        order: 1,
      },
    },
  },
  destruction: {
    ...colDefById['destruction'],
    headerComponentParams: {
      footnote: {
        id: '2',
        content:
          'Amounts of HFC-23 captured for destruction or feedstock use will not be counted as production as per Article 1 of the Montreal Protocol.',
        icon: true,
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
    headerComponentParams: {
      footnote: {
        id: '2',
        content:
          'Amounts of HFC-23 captured for destruction or feedstock use will not be counted as production as per Article 1 of the Montreal Protocol.',
        icon: true,
        order: 2,
      },
    },
  },
}

export { sectionColDefById }
