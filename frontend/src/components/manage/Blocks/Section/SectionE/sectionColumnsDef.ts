import { ColDef, ColGroupDef } from 'ag-grid-community'

import { colDefById, defaultColGroupDef } from '@ors/config/Table/columnsDef'

const VOLUNTARY_CLASS =
  'bg-gray-200 theme-dark:bg-gray-900/40 text-inherit ag-text-center'

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
    headerComponentParams: {
      footnote: {
        id: '1',
        content: 'This includes amounts transferred to other facilities.',
        icon: false,
        order: 1,
      },
    },
  },
  destruction_wpc: {
    ...colDefById['destruction_wpc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
  },
  facility: {
    // flex: 1,
  },
  feedstock_gc: {
    ...colDefById['feedstock_gc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    // flex: 1.2,
    headerClass: VOLUNTARY_CLASS,
  },
  feedstock_wpc: {
    ...colDefById['feedstock_wpc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
  },
  generated_emissions: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  stored_at_start_of_year: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  stored_at_end_of_year: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  remarks: {
    ...colDefById['remarks'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  total_amount_generated: {
    ...colDefById['total_amount_generated'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    // flex: 1.2,
    headerClass: VOLUNTARY_CLASS,
    headerComponentParams: {
      footnote: {
        id: '*',
        content:
          '"Total amount generated" refers to the total amount whether captured or not.',
        icon: false,
        order: 0,
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
    },
  },
}

export { sectionColDefById, sectionColGroupDefById }
