import { runValidators } from '@ors/components/manage/Blocks/AnnualProgressReport/validation.tsx'
import { dataTypeDefinitions } from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'
import CellValidationAlert from '@ors/components/manage/AgWidgets/CellValidationWidget/CellValidationAlert.tsx'
import cx from 'classnames'
import React from 'react'

function CellValidation(props: any) {
  const { value, data, colDef, valueFormatted } = props

  const colValidators = colDef?.validators ?? []
  const typeValidators =
    dataTypeDefinitions[colDef?.cellDataType]?.validators ?? []

  const errors = runValidators(
    [...typeValidators, ...colValidators],
    value,
    data,
  )
  const hasErrors = errors.length > 0

  return (
    <div
      className={cx({
        'flex gap-x-2': hasErrors,
        'items-center justify-center':
          hasErrors && colDef?.cellDataType !== 'text',
        'text-center': !hasErrors && colDef?.cellDataType !== 'text',
      })}
    >
      {hasErrors && <CellValidationAlert errors={errors as any} />}
      <div>{hasErrors ? value : valueFormatted || value}</div>
    </div>
  )
}

export default React.memo(CellValidation)
