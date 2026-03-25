import { ColDef, ICellRendererParams } from 'ag-grid-community'

import { colDefById } from '@ors/config/Table/columnsDef'

import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { CPModel, ReportVariant } from '@ors/types/variants.ts'

const sectionColDefByIdFunc = (
  variant: ReportVariant,
): Record<string, ColDef> => ({
  ...colDefById,
  current_year_price: {
    cellClass: 'ag-text-center',
    headerClass: 'ag-text-center',
  },
  display_name: {
    ...colDefById['display_name'],
    ...(variant.match([CPModel.II, CPModel.III]) ? { minWidth: 300 } : {}),
    cellRenderer: (props: ICellRendererParams) => {
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
  },
  is_fob: {
    ...colDefById['is_fob'],
    category: 'checkbox',
    cellClass: 'ag-text-center',
    editable: false,
    field: 'is_fob',
    headerClass: 'ag-text-center',
    headerName: 'FOB price',
  },
  is_retail: {
    ...colDefById['is_retail'],
    category: 'checkbox',
    cellClass: 'ag-text-center',
    editable: false,
    field: 'is_retail',
    headerClass: 'ag-text-center',
    headerName: 'Retail price',
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
      ...(variant.match([CPModel.II, CPModel.III])
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
