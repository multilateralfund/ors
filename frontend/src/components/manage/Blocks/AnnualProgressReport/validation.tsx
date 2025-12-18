import dayjs from 'dayjs'
import { isNil } from 'lodash'

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

  return words.length > 300 ? 'Free text is limited to 300 words.' : null
}
