import { GridApi, RowDataTransaction } from 'ag-grid-community'
import { isNaN, isNull, isNumber, isString } from 'lodash'

export function parseNumber(number: any) {
  const parsedNumber = isString(number)
    ? parseFloat(number)
    : isNumber(number)
    ? number
    : null
  return isNull(parsedNumber) || isNaN(parsedNumber) ? null : parsedNumber
}

export function applyTransaction(
  api: GridApi,
  transaction: RowDataTransaction<any>,
) {
  try {
    api.applyTransaction(transaction)
  } catch (error) {
    setTimeout(() => {
      api.applyTransaction(transaction)
    }, 0)
  }
}

export function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  )
}
