import { ColDef, ColGroupDef } from 'ag-grid-community'

import { colDefById, defaultColGroupDef } from '@ors/config/Table/columnsDef'

const VOLUNTARY_CLASS = 'bg-gray-200 theme-dark:bg-gray-900/40'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  all_uses: {
    ...colDefById['all_uses'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
  },
  destruction: {
    ...colDefById['destruction'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
  },
  destruction_wpc: {
    ...colDefById['destruction_wpc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
    headerComponentParams: {
      footnote: {
        id: '4',
        content: 'Amount destroyed in the facility.',
        icon: true,
        order: 4,
      },
    },
  },
  facility: {
    flex: 1,
  },
  feedstock_gc: {
    ...colDefById['feedstock_gc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    flex: 1.2,
    headerClass: VOLUNTARY_CLASS,
  },
  feedstock_wpc: {
    ...colDefById['feedstock_wpc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
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
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    flex: 1.2,
    headerClass: VOLUNTARY_CLASS,
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
  },
}
const sectionColGroupDefById: Record<string, Omit<ColGroupDef, 'children'>> = {
  amount_generated_and_captured: {
    headerClass: VOLUNTARY_CLASS,
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
