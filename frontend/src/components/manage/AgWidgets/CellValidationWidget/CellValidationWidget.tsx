import { useContext } from 'react'

import cx from 'classnames'

import ValidationContext from '@ors/contexts/Validation/ValidationContext'
import { ValidationSchemaKeys } from '@ors/contexts/Validation/types'

import CellValidationAlert from './CellValidationAlert'

export default function CellValidationWidget(props: any) {
  const validation =
    useContext(ValidationContext)?.errors[
      props.context?.section.id as ValidationSchemaKeys
    ]

  const rowErrors = validation?.rows[props.data.row_id] || []
  const cellErrors = rowErrors.filter((err) =>
    err.highlight_cells.includes(props.column.colId),
  )

  const showErrorInfo =
    props.column.colId === 'display_name' && rowErrors.length > 0

  const errors = showErrorInfo ? rowErrors : cellErrors
  const display = errors.length > 0

  return (
    <div
      className={cx(
        'absolute right-1 top-1.5 inline-block leading-tight ease-in-out transition-all',
        { 'collapse opacity-0': !display, 'opacity-100': display },
      )}
    >
      <CellValidationAlert errors={errors} />
    </div>
  )
}
