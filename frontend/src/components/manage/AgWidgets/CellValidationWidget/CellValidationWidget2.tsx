import cx from 'classnames'

import { useStore } from '@ors/store'
import CellValidationAlert2 from './CellValidationAlert2'
import { find } from 'lodash'

export default function CellValidationWidget2(props: any) {
  const { rowErrors } = useStore((state) => state.bpErrors)

  const currentErrors = find(
    rowErrors,
    (error) => error.rowIndex === props.data.row_id,
  )

  const display = true
  // currentErrors && keys(currentErrors).includes(props.colDef.field)

  return (
    <div
      className={cx(
        'absolute bottom-1/3 right-1',
        // 'flex grow flex-row-reverse',
        // { hidden: !display },
        props.className,
      )}
    >
      <CellValidationAlert2
        errors={currentErrors?.[props.colDef.field] || []}
        {...props}
      />
    </div>
  )
}
