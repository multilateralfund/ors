import { ColDef, ColGroupDef } from 'ag-grid-community'

import { colDefById, defaultColGroupDef } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  destruction_wpc: {
    ...colDefById['destruction_wpc'],
    headerComponentParams: {
      footnote: {
        id: '4',
        content: 'Amount destroyed in the facility.',
        icon: true,
        order: 4,
      },
    },
  },
  feedstock_wpc: {
    ...colDefById['feedstock_wpc'],
    headerComponentParams: {
      footnote: {
        id: '3',
        content:
          'Amount converted to other substances in the facility. The sum of these amounts is not to be reported under Section D.',
        icon: true,
        order: 3,
      },
    },
  },
  total_amount_generated: {
    ...colDefById['total_amount_generated'],
    headerComponentParams: {
      footnote: {
        id: '1',
        content:
          '"Total amount generated" refers to the total amount whether captured or not. The sum of these amounts is not to be reported under Section D.',
        icon: true,
        order: 1,
      },
      info: true,
    },
  }
}
const sectionColGroupDefById: Record<string, Omit<ColGroupDef, "children">> = {
  amount_generated_and_captured: {
    headerGroupComponentParams: {
      ...defaultColGroupDef.headerGroupComponentParams,
      footnote: {
        id: '2',
        content:
          'The sums of these amounts are to be reported under Section D.',
        icon: true,
        order: 2,
      },
    },
  },
}

export { sectionColDefById, sectionColGroupDefById }

