import { ColDef } from 'ag-grid-community'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  remarks: {
    ...colDefById['remarks'],
    headerComponentParams: {
      footnote: {
        id: '1',
        content: 'Indicate whether the prices are FOB or retail prices.',
        icon: true,
      },
    },
  },
}

export { sectionColDefById }
