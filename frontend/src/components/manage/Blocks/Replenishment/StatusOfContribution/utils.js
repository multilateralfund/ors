import { makePeriodOptions } from '@ors/components/manage/Blocks/Replenishment/utils'

import { MAX_DECIMALS, MIN_DECIMALS } from '../constants'

export const SC_COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'agreed_contributions', label: 'Agreed Contributions' },
  { field: 'cash_payments', label: 'Cash Payments' },
  { field: 'bilateral_assisstance', label: 'Bilateral Assistance' },
  { field: 'promissory_notes', label: 'Promissory Notes' },
  { field: 'outstanding_contributions', label: 'Outstanding Contribution' },
]

export const mockScAnnualOptions = () => {
  const options = []
  for (let i = 2023; i >= 1991; i--) {
    options.push({ label: i.toString(), value: i.toString() })
  }

  return options
}

export function mockSCPeriodOptions(periods) {
  const options = periods.length > 1 ? periods.slice(1) : periods.slice(0)

  const fillFrom = 1991
  const fillTo =
    (options.length ? options[options.length - 1].start_year : 2023) - 1

  for (let y = fillTo; y >= fillFrom; y--) {
    if ((fillTo - y) % 3 === 0) {
      options.push({ end_year: y, start_year: y - 2 })
      y -= 2
    }
  }

  return makePeriodOptions(options)
}

export function transformData(data) {
  const rows = []

  for (let i = 0; i < data.length; i++) {
    rows.push({
      agreed_contributions: data[i].agreed_contributions,
      bilateral_assisstance: data[i].bilateral_assisstance,
      cash_payments: data[i].cash_payments,
      country: data[i].country.name_alt,
      country_iso3: data[i].country.iso3,
      gain_loss: data[i].gain_loss,
      outstanding_contributions: data[i].outstanding_contributions,
      promissory_notes: data[i].promissory_notes,
    })
  }

  return rows
}

export function formatTableRows(rows, minDigits, maxDigits) {
  const result = new Array(rows.length)

  for (let i = 0; i < rows.length; i++) {
    result[i] = {}

    const keys = Object.keys(rows[i])

    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      let value = rows[i][key]

      // As per specs, transform values in range (-1, 1) to 0
      if (typeof value === 'number' && value > -1 && value < 1) {
        value = 0
      }

      switch (typeof value) {
        case 'number':
          result[i][key] = value.toLocaleString('en-US', {
            maximumFractionDigits: maxDigits ?? 0 ?? MAX_DECIMALS,
            minimumFractionDigits: minDigits ?? 0 ?? MIN_DECIMALS,
          })
          break
        default:
          result[i][key] = value
      }
    }
  }

  return result
}
