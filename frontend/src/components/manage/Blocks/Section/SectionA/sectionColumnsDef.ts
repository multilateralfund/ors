import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import { RowData } from './Create/Create'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  display_name: {
    ...colDefById['display_name'],
    cellRendererParams: (props: ICellRendererParams<RowData>) => {
      return {
        className: cx({
          'font-bold': includes(
            ['group', 'total', 'subtotal'],
            props.data?.rowType,
          ),
        }),
        ...(props.data?.row_id === 'other-new_substance'
          ? {
              footnote: {
                id: '2',
                content: 'Indicate relevant controlled substances.',
                icon: true,
              },
            }
          : {}),
      }
    },
    headerComponentParams: {
      footnote: {
        id: '1',
        content:
          'Where the data involves a blend of two or more substances, the quantities of individual components of controlled substances must be indicated separately.',
        icon: true,
      },
    },
  },
  export_quotas: {
    initialWidth: 80,
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
