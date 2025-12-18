import dayjs from 'dayjs'
import { isNil } from 'lodash'
import { dataTypeDefinitions } from '@ors/components/manage/Blocks/AnnualProgressReport/schema.tsx'

type Validator = (value: any, row: any) => string | null
export type ValidatorMixin = {
  validators?: Validator[]
}

export function runValidators(
  validators: Validator[] = [],
  value: any,
  row: any,
) {
  const errors = []

  for (const validator of validators) {
    const error = validator(value, row)
    if (error) {
      errors.push({ message: error })
    }
  }

  return errors
}

export function validateField(colDef: any, value: any, row: any) {
  const colValidators = colDef?.validators ?? []
  const typeValidators =
    dataTypeDefinitions[colDef?.cellDataType]?.validators ?? []

  const errors = runValidators(
    [...typeValidators, ...colValidators],
    value,
    row,
  )
  const hasErrors = errors.length > 0

  return {
    errors,
    hasErrors,
  }
}

export function validateRows(rows: any[], columnDefs: any[]) {
  const formErrors = []

  for (const row of rows) {
    const rowErrors = {}
    for (const colDef of columnDefs) {
      if (!colDef.canBeEdited) {
        continue
      }

      const { errors, hasErrors } = validateField(
        colDef,
        row[colDef.field],
        row,
      )
      if (hasErrors) {
        // @ts-ignore
        rowErrors[colDef.headerName] = errors.map((e) => e.message)
      }
    }
    formErrors.push(rowErrors)
  }

  const hasErrors = formErrors.some((err) => Object.keys(err).length > 0)

  return { formErrors, hasErrors }
}

export function validateDate(value: any) {
  if (isNil(value)) {
    return null
  }

  return dayjs(value).isValid()
    ? null
    : 'Invalid date, use the DD/MM/YYYY format'
}

export function validateNumber(value: any) {
  if (isNil(value)) {
    return null
  }

  const n = Number(value)
  if (isNaN(n) || !isFinite(n)) {
    return 'Invalid number'
  }

  return null
}

export function validateText(value: any) {
  const words = value.split(' ')

  return words.length > 300 ? 'Free text is limited to 300 words' : null
}
