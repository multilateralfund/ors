import { isNaN, isNull } from 'lodash'

export function parseNumber(number: any) {
  const parsedNumber = parseFloat(number)
  return isNull(parsedNumber) || isNaN(parsedNumber) ? null : parsedNumber
}
