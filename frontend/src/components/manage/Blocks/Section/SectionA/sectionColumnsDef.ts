import { ColDef } from 'ag-grid-community'
import { CustomCellRendererProps } from 'ag-grid-react'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  display_name: {
    ...colDefById['display_name'],
    cellRendererParams: (props: CustomCellRendererProps) => ({
      ...(props.data.row_id === 'other-new_substance'
        ? {
            footnote: {
              id: '2',
              content: 'Indicate relevant controlled substances.',
              icon: true,
            },
          }
        : {}),
    }),
    headerComponentParams: {
      footnote: {
        id: '1',
        content:
          'Where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately.',
        icon: true,
      },
    },
  },
  remarks: {
    ...colDefById['remarks'],
    headerComponentParams: {
      footnote: {
        id: '3',
        content:
          'Provide explanation if total sector use and consumption (import-export+production) is different (e.g, stockpiling).',
        icon: true,
      },
    },
  },
}

export { sectionColDefById }
