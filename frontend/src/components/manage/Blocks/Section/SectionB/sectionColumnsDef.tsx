import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes, startsWith } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { IAgHeaderParams } from '@ors/components/manage/AgComponents/AgHeaderComponent'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'
import { unknownVariant } from '@ors/slices/createCPReportsSlice.ts'

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
      const variant = (props.context?.variant ??
        unknownVariant) as ReportVariant
      if (
        variant.match([CPModel.IV, CPModel.V, CPModel.VI]) &&
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
      const variant = (props.context?.variant ??
        unknownVariant) as ReportVariant
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
                content: variant.match([CPModel.IV, CPModel.V, CPModel.VI])
                  ? 'Mixture of Controlled Substances - When reporting blends/mixtures, reporting of controlled substances should not be duplicated. For the CP report, countries should report use of individual controlled substances and quantities of blends/mixtures used, separately, while ensuring that the amounts of controlled substances are not reported more than once.'
                  : 'When reporting blends/mixtures, reporting of controlled substances should not be duplicated. For the CP report, countries should report use of individual controlled substances and quantities of blends/mixtures used, separately, while ensuring that the amounts of controlled substances are not reported more than once.',
                icon: false,
                order: 1,
              },
            }
          : {}),
        ...(props.data.row_id === 'other-new_substance' &&
        !variant.match([CPModel.V, CPModel.VI])
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
      const variant = (props.context?.variant ??
        unknownVariant) as ReportVariant
      return {
        footnote: {
          id: variant.match([CPModel.V, CPModel.VI]) ? '3' : '5',
          content:
            'Provide explanation if total sector use and consumption (import-export+production) is different (e.g, stockpiling).',
          icon: false,
          order: variant.match([CPModel.V, CPModel.VI]) ? 3 : 5,
        },
      }
    },
  },
}

export { sectionColDefById }
