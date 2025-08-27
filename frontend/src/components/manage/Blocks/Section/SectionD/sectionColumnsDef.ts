import { ColDef } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { colDefById, defaultColGroupDef } from '@ors/config/Table/columnsDef'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  all_uses: {
    ...colDefById['all_uses'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
    // initialWidth: 200,
  },
  other_uses: {
    headerGroupComponentParams: {
      ...defaultColGroupDef.headerGroupComponentParams,
      footnote: {
        id: '*',
        content:
          'Against each substance produced for exempted essential, critical, high-ambient-temperature or other uses, please specify the meeting of the parties decision that approved the use.',
        icon: false,
        order: 1,
      },
    },
  },
  // destruction: {
  //   ...colDefById['destruction'],
  //   cellClass: 'ag-text-center',
  //   headerClass: 'ag-text-center',
  // },
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
        content: 'Unintentional generation',
        order: 1,
      },
    }),
  },
  feedstock: {
    ...colDefById['feedstock'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
}

const sectionDefaultColDef: ColDef<any, any> = {
  autoHeaderHeight: true,
}

export { sectionColDefById, sectionDefaultColDef }
