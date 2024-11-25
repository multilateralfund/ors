import { useContext } from 'react'

import cx from 'classnames'

import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { ValidationSchemaKeys } from '@ors/contexts/Validation/types'

import CellValidationAlert from './CellValidationAlert'

export default function CellValidationWidget(props: any) {
  const validationContext = useContext(ValidationContext)
  const validation =
    validationContext?.errors[props.context?.section.id as ValidationSchemaKeys]

  const globalErrors = validation?.global ?? []
  const rowErrors = [
    ...(validation?.rows[props.data.row_id] || []),
    ...globalErrors.filter((v) => v.row_id === props.data.row_id),
  ]
  const cellErrors = rowErrors.filter((err) =>
    (err?.highlight_cells || []).includes(props.column.colId),
  )

  const showErrorInfo =
    props.column.colId === 'display_name' && rowErrors.length > 0

  const errors = showErrorInfo ? rowErrors : cellErrors
  const display = !validationContext?.silent && errors.length > 0

  return (
    <div
      className={cx(
        'flex grow flex-row-reverse',
        { hidden: !display },
        props.className,
      )}
    >
      <CellValidationAlert errors={errors} />
    </div>
  )
}
