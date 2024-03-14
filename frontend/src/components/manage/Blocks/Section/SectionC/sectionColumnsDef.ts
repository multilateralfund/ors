import { ColDef } from 'ag-grid-community'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  display_name: {
    ...colDefById['display_name'],
    initialWidth: Math.floor(
      (colDefById['display_name']?.initialWidth || 130) * 1.5,
    ),
  },
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
