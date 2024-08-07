import { makePeriodOptions } from '@ors/components/manage/Blocks/Replenishment/utils'

import { MAX_DECIMALS, MIN_DECIMALS } from '../constants'

export const SC_COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'agreed_contributions', label: 'Agreed Contributions' },
  { field: 'cash_payments', label: 'Cash Payments' },
  { field: 'bilateral_assistance', label: 'Bilateral Assistance' },
  { field: 'promissory_notes', label: 'Promissory Notes' },
  { field: 'outstanding_contributions', label: 'Outstanding Contribution' },
]

const FIRST_YEAR = 1991

export const scAnnualOptions = (periods) => {
  const options = []

  const latestYear =
    periods.length > 0 ? periods[0].end_year : new Date().getFullYear()
  for (let year = latestYear; year >= FIRST_YEAR; year--) {
    options.push({ label: year.toString(), value: year.toString() })
  }

  return options
}

export function scPeriodOptions(periods) {
  const options = []
  let startYear
  periods.forEach((period) => {
    startYear = period.start_year
    options.push({
      end_year: period.end_year,
      start_year: period.start_year,
    })
  })

  while (startYear > FIRST_YEAR) {
    options.push({ end_year: startYear - 1, start_year: startYear - 3 })
    startYear -= 3
  }

  return makePeriodOptions(options)
}

export function transformData(data) {
  const rows = []

  for (let i = 0; i < data.length; i++) {
    rows.push({
      agreed_contributions: data[i].agreed_contributions,
      bilateral_assistance: data[i].bilateral_assistance,
      cash_payments: data[i].cash_payments,
      country: data[i].country.name_alt,
      country_id: data[i].country.id,
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
