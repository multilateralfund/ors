import {
  ColDef,
  EditableCallbackParams,
  ICellRendererParams,
} from 'ag-grid-community'
import cx from 'classnames'
import { includes } from 'lodash'

import { NON_EDITABLE_ROWS } from './settings'

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

const defaultColDefEdit: ColDef = {
  editable: (props: EditableCallbackParams) => {
    if (includes(NON_EDITABLE_ROWS, props.data?.rowType)) {
      return false
    }
    return true
  },
}

export default defaultColDef
export { defaultColDefEdit }
