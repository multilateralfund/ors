import { ColDef, ColGroupDef } from 'ag-grid-community'

import { colDefById, defaultColGroupDef } from '@ors/config/Table/columnsDef'
import { shouldEnableNewCPDataFormatting } from '@ors/components/manage/Utils/utilFunctions.ts'

const VOLUNTARY_CLASS =
  'bg-gray-200 theme-dark:bg-gray-900/40 text-inherit ag-text-center'

const sectionColDefByIdFunc = (model: string): Record<string, ColDef> => ({
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
    ...(shouldEnableNewCPDataFormatting(model)
      ? {
          headerComponentParams: {
            footnote: {
              id: '1',
              content: 'This includes amounts transferred to other facilities.',
              icon: false,
              order: 1,
            },
          },
        }
      : {}),
  },
  destruction_wpc: {
    ...colDefById['destruction_wpc'],
    cellClass: () => {
      return VOLUNTARY_CLASS
    },
    headerClass: VOLUNTARY_CLASS,
    ...(shouldEnableNewCPDataFormatting(model)
      ? {}
      : {
          headerComponentParams: {
            footnote: {
              id: '4',
              content: 'Amount destroyed in the facility.',
              icon: false,
              order: 4,
            },
          },
        }),
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
    ...(shouldEnableNewCPDataFormatting(model)
      ? {}
      : {
          headerComponentParams: {
            footnote: {
              id: '3',
              content:
                'Amount converted to other substances in the facility. The sum of these amounts is not to be reported under Section D.',
              icon: false,
              order: 3,
            },
          },
        }),
  },
  generated_emissions: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  ...(shouldEnableNewCPDataFormatting(model)
    ? {
        stored_at_start_of_year: {
          headerClass: VOLUNTARY_CLASS,
          cellClass: () => {
            return VOLUNTARY_CLASS
          },
        },
        stored_at_end_of_year: {
          headerClass: VOLUNTARY_CLASS,
          cellClass: () => {
            return VOLUNTARY_CLASS
          },
        },
      }
    : {}),
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
    ...(shouldEnableNewCPDataFormatting(model)
      ? {
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
        }
      : {
          headerComponentParams: {
            footnote: {
              id: '1',
              content:
                '"Total amount generated" refers to the total amount whether captured or not. The sum of these amounts is not to be reported under Section D.',
              icon: false,
              order: 1,
            },
            info: true,
          },
        }),
  },
})

const sectionColGroupDefByIdFunc = (
  model: string,
): Record<string, Omit<ColGroupDef, 'children'>> => ({
  amount_generated_and_captured: {
    headerClass: VOLUNTARY_CLASS,
    headerGroupComponentParams: {
      ...defaultColGroupDef.headerGroupComponentParams,
      ...(shouldEnableNewCPDataFormatting(model)
        ? {}
        : {
            footnote: {
              id: '2',
              content:
                'The sums of these amounts are to be reported under Section D.',
              icon: false,
              order: 2,
            },
          }),
    },
  },
})

export { sectionColDefByIdFunc, sectionColGroupDefByIdFunc }
