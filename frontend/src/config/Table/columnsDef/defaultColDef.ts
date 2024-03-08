import { ColDef, ICellRendererParams } from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

const defaultColDef: ColDef = {
  cellRendererParams: (props: ICellRendererParams) => {
    return {
      className: cx({
        'font-bold': includes(['subtotal', 'total'], props.data.rowType),
      }),
      maximumFractionDigits: 2,
    }
  },
  headerComponentParams: {
    className: 'font-bold',
  },
  minWidth: 80,
}

export default defaultColDef
