import { ColDef } from 'ag-grid-community'
import cx from 'classnames'
import { includes, startsWith } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  display_name: {
    ...colDefById['display_name'],
    cellRendererParams: (props: any) => ({
      className: cx({
        'font-bold': includes(['group', 'total'], props.data.rowType),
      }),
      footnote: !!props.data.chemical_note && {
        content: props.data.chemical_note,
        index: '**',
        order: 999,
      },
      ...(props.data.rowType === 'group' &&
      startsWith(props.data.display_name, 'Blends')
        ? {
            footnote: {
              id: '1',
              content:
                'When reporting blends/mixtures, reporting of controlled substances should not be duplicated. For the CP report, countries should report use of individual controlled substances and quantities of blends/mixtures used, separately, while ensuring that the amounts of controlled substances are not reported more than once.',
              icon: true,
              order: 1,
            },
          }
        : {}),
    }),
  },
  manufacturing_blends: {
    ...colDefById['manufacturing_blends'],
    headerComponentParams: {
      footnote: {
        id: '4',
        content: 'Tentative/best estimates.',
        icon: true,
        index: '*',
        order: 4,
      },
    },
  },
  remarks: {
    ...colDefById['remarks'],
    headerComponentParams: {
      footnote: {
        id: '2',
        content:
          'Provide explanation if total sector use and consumption (import-export+production) is different (e.g, stockpiling).',
        icon: true,
        order: 2,
      },
    },
  },
}

export { sectionColDefById }
