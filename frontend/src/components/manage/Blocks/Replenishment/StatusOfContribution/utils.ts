import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import { ApiReplenishmentSoCStatus } from '@ors/types/api_replenishment_status_of_contributions'

import { makePeriodOptions } from '@ors/components/manage/Blocks/Replenishment/utils'

import { MAX_DECIMALS, MIN_DECIMALS } from '../constants'
import { Contributions, SoCRow } from './types'

export const SC_COLUMNS = [
  { field: 'country', label: 'Country' },
  { field: 'agreed_contributions', label: 'Agreed Contributions' },
  { field: 'cash_payments', label: 'Cash Payments' },
  { field: 'bilateral_assistance', label: 'Bilateral Assistance' },
  { field: 'promissory_notes', label: 'Promissory Notes' },
  { field: 'outstanding_contributions', label: 'Outstanding Contribution' },
  { field: 'gain_loss', label: 'Exchange (Gain)/Loss', subLabel: '(negative amount = Gain)' },
]

const FIRST_YEAR = 1991

export const scAnnualOptions = (periods: ApiReplenishment[]) => {
  const options = []

  const latestYear =
    periods.length > 0 ? periods[0].end_year : new Date().getFullYear()
  for (let year = latestYear; year >= FIRST_YEAR; year--) {
    options.push({ label: year.toString(), value: year.toString() })
  }

  return options
}

export function scPeriodOptions(periods: ApiReplenishment[]) {
  const options = []
  let startYear: number
  periods.forEach((period) => {
    startYear = period.start_year
    options.push({
      end_year: period.end_year,
      start_year: period.start_year,
    })
  })

  while (startYear! > FIRST_YEAR) {
    options.push({ end_year: startYear! - 1, start_year: startYear! - 3 })
    startYear! -= 3
  }

  return makePeriodOptions(options)
}

export function transformData(data: ApiReplenishmentSoCStatus[]) {
  const rows: SoCRow[] = []

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

export function formatTableRows(
  rows: Record<string, any>,
  minDigits?: number,
  maxDigits?: number,
) {
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

export function extractContributions(rows: Record<string, number>[]) {
  const r: Contributions = {
    bilateral_assistance_countries: 0,
    bilateral_assistance_countries_percentage: 0,

    contributions: 0,
    contributions_advance: 0,
    contributions_in_full: 0,
    contributions_percentage: 0,

    countries: rows.length,
    outstanding_contributions: 0,

    outstanding_contributions_percentage: 0,
    promissory_notes_countries: 0,

    promissory_notes_countries_percentage: 0,
  }

  for (let i = 0; i < rows.length; i++) {
    const bilateral_assistance = rows[i].bilateral_assistance
    const promissory_notes = rows[i].promissory_notes
    const cash_payments = rows[i].cash_payments

    let value = rows[i].outstanding_contributions

    if (value >= -5 && value <= 5) {
      value = 0
    }
    if (value < 0) {
      r.contributions_advance += 1
      r.contributions_in_full += 1
    } else if (value === 0) {
      r.contributions_in_full += 1
    } else {
      r.outstanding_contributions += 1
    }

    if (cash_payments >= 5) {
      r.contributions += 1
    }
    if (bilateral_assistance) {
      r.bilateral_assistance_countries += 1
    }
    if (promissory_notes >= 5) {
      r.promissory_notes_countries += 1
    }
  }

  r.contributions_percentage = (r.contributions * 100) / rows.length
  r.bilateral_assistance_countries_percentage =
    (r.bilateral_assistance_countries * 100) / rows.length
  r.promissory_notes_countries_percentage =
    (r.promissory_notes_countries * 100) / rows.length
  r.outstanding_contributions_percentage =
    (r.outstanding_contributions * 100) / rows.length

  return r
}
