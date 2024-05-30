import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes, startsWith } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { IAgHeaderParams } from '@ors/components/manage/AgComponents/AgHeaderComponent'

const sectionColDefById: Record<string, ColDef> = {
  ...colDefById,
  banned_date: {
    ...colDefById['banned_date'],
    headerComponentParams: {
      footnote: {
        content: 'If imports are banned, indicate date ban commenced',
        icon: false,
        index: '***',
        order: 9999,
      },
    },
    headerName: 'Date ban commenced',
  },
  display_name: {
    ...colDefById['display_name'],
    cellRenderer: (props: ICellRendererParams) => {
      const model = props.context?.variant.model
      if (
        includes(['IV', 'V'], model) &&
        props.data?.row_id?.startsWith('blend_')
      ) {
        const newProps = {
          ...props,
          tooltipValue: props.value,
          value: props?.value?.split('(')[0],
        }
        return <AgCellRenderer {...newProps} />
      }
      return <AgCellRenderer {...props} />
    },
    cellRendererParams: (props: ICellRendererParams) => {
      const model = props.context?.variant.model
      return {
        className: cx({
          'font-bold': includes(
            ['group', 'total', 'subtotal'],
            props.data.rowType,
          ),
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
                content: includes(['IV', 'V'], model)
                  ? 'Mixture of Controlled Substances - When reporting blends/mixtures, reporting of controlled substances should not be duplicated. For the CP report, countries should report use of individual controlled substances and quantities of blends/mixtures used, separately, while ensuring that the amounts of controlled substances are not reported more than once.'
                  : 'When reporting blends/mixtures, reporting of controlled substances should not be duplicated. For the CP report, countries should report use of individual controlled substances and quantities of blends/mixtures used, separately, while ensuring that the amounts of controlled substances are not reported more than once.',
                icon: false,
                order: 1,
              },
            }
          : {}),
        ...(props.data.row_id === 'other-new_substance' &&
        !includes(['V'], model)
          ? {
              footnote: {
                id: '2',
                content:
                  'If a non-standard blend not listed in the above table is used, please indicate the percentage of each constituent controlled substance of the blend being reported in the remarks column.',
                icon: true,
                order: 2,
              },
            }
          : {}),
      }
    },
  },
  manufacturing_blends: {
    ...colDefById['manufacturing_blends'],
    headerComponentParams: {
      footnote: {
        content: 'Tentative/best estimates.',
        icon: false,
        index: '*',
        order: 888,
      },
    },
  },
  remarks: {
    ...colDefById['remarks'],
    headerClass: 'ag-text-center',
    headerComponentParams: (props: IAgHeaderParams) => {
      const model = props.context?.variant.model
      return {
        footnote: {
          id: includes(['V'], model) ? '3' : '5',
          content:
            'Provide explanation if total sector use and consumption (import-export+production) is different (e.g, stockpiling).',
          icon: false,
          order: includes(['V'], model) ? 3 : 5,
        },
      }
    },
  },
}

export { sectionColDefById }
