import type { IRow } from './types'

export function validateTotals(row: IRow) {
  return (
    row.imports - row.exports + row.production ==
    row.record_usages.reduce((acc, usage) => acc + usage.quantity, 0)
  )
}
