import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { includes } from 'lodash'

import { colDefById } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'

const sectionColDefByIdFunc = (model: string): Record<string, ColDef> => ({
  ...colDefById,
  current_year_price: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  display_name: {
    ...colDefById['display_name'],
    ...(includes(['II', 'III'], model) ? { minWidth: 300 } : {}),
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
  },
  previous_year_price: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  remarks: {
    ...colDefById['remarks'],
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
    headerComponentParams: {
      ...(includes(['II', 'III'], model)
        ? {}
        : {
            footnote: {
              id: '1',
              content: 'Indicate whether the prices are FOB or retail prices.',
              icon: false,
            },
          }),
    },
  },
})

export { sectionColDefByIdFunc }
