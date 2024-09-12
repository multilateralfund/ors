import { fixFloat } from '@ors/helpers/Utils/Utils'

import { MAX_DECIMALS, MIN_DECIMALS, PRECISION } from '../constants'
import { getDefaultFieldSorter } from '../utils'
import { SAContribution, SATableRow } from './types'

export function nullIfNaN(value: number) {
  let result: null | number = value

  if (typeof value === 'number' && isNaN(value)) {
    result = null
  }

  return result
}

export function uniformDecimals(v: null | number) {
  let result = null
  if (v !== null) {
    result = fixFloat(v, MAX_DECIMALS)
  }
  return result
}

export function clearNew(d: Record<string, any>) {
  const r = []
  for (let i = 0; i < d.length; i++) {
    r.push(d[i])
    delete r[i].isNew
  }
  return r
}

export function getOverrideOrDefault(
  record: SAContribution,
  name: keyof SAContribution,
) {
  let result = record[`override_${name}` as keyof SAContribution]
  if (result === undefined) {
    result = record[name]
  }
  return result
}

export function computeTableData(
  tableData: SAContribution[],
  totalReplenishment: number,
) {
  const result = new Array(tableData.length)

  let adj_un_soa = 0
  let adj_un_soa_percent = 100

  for (let i = 0; i < tableData.length; i++) {
    if (tableData[i].iso3 === 'USA') {
      adj_un_soa_percent -=
        nullIfNaN(
          fixFloat(
            (getOverrideOrDefault(tableData[i], 'un_soa') as number) ?? 0,
            PRECISION,
          ),
        ) ?? 0
    } else {
      adj_un_soa +=
        nullIfNaN(
          fixFloat(
            (getOverrideOrDefault(tableData[i], 'un_soa') as number) ?? 0,
            PRECISION,
          ),
        ) ?? 0
    }
  }

  adj_un_soa_percent -= fixFloat(adj_un_soa, PRECISION)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = { ...tableData[i] }

    const un_soa = fixFloat(
      (getOverrideOrDefault(tableData[i], 'un_soa') as number) ?? 0,
      PRECISION,
    )

    if (tableData[i].iso3 === 'USA') {
      result[i].adj_un_soa = un_soa
    } else {
      result[i].adj_un_soa = nullIfNaN(
        fixFloat(
          (un_soa / adj_un_soa) * adj_un_soa_percent + un_soa,
          PRECISION,
        ),
      )
    }

    result[i].annual_contributions = nullIfNaN(
      fixFloat(
        ((getOverrideOrDefault(result[i], 'adj_un_soa') as number) *
          totalReplenishment) /
          100,
        PRECISION,
      ),
    )

    // Does it qualify for FERM?
    result[i].qual_ferm =
      ((getOverrideOrDefault(result[i], 'avg_ir') as number) ?? 100) < 10
        ? true
        : false
    result[i].qual_ferm = result[i].qual_ferm || result[i].ferm_cur === 'Euro'

    // Calculate contribution in national currency for those qualifying for FERM
    result[i].ferm_cur_amount =
      getOverrideOrDefault(result[i], 'qual_ferm') &&
      getOverrideOrDefault(result[i], 'ferm_rate') !== null
        ? (getOverrideOrDefault(result[i], 'ferm_rate') as number) *
          result[i].annual_contributions
        : null

    if (!result[i].opted_for_ferm && result[i].qual_ferm) {
      result[i].opted_for_ferm = false
    } else if (!result[i].qual_ferm) {
      result[i].opted_for_ferm = null
      delete result[i].override_opted_for_ferm
    }
  }

  return result
}

function formattedValue(value: boolean | null | number | string) {
  let newValue = value

  if (value === null) {
    newValue = 'N/A'
  } else if (typeof value === 'number') {
    newValue = value.toLocaleString('en-US', {
      maximumFractionDigits: MAX_DECIMALS,
      minimumFractionDigits: MIN_DECIMALS,
    })
  } else if (value === false) {
    newValue = 'No'
  } else if (value === true) {
    newValue = 'Yes'
  }

  return newValue
}

export function formatTableData(
  tableData: SAContribution[],
  editableColumns: string[],
) {
  const result: Record<string, any>[] = new Array(tableData.length)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = {}
    const keys = Object.keys(tableData[i])
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j] as keyof SAContribution
      const overrideKey = `override_${key}` as keyof SAContribution
      const hasOverride = tableData[i].hasOwnProperty(overrideKey)
      const value = hasOverride ? tableData[i][overrideKey] : tableData[i][key]

      let isEditable = editableColumns.includes(key)

      let newValue

      if (key === 'opted_for_ferm' && value == null) {
        newValue = '-'
        isEditable = false
      } else if (key === 'un_soa' && value === null) {
        newValue = ''
      } else {
        newValue = value !== undefined ? formattedValue(value) : value
      }

      if (key === 'adj_un_soa' && tableData[i].iso3 == 'USA') {
        isEditable = false
      }

      result[i][key] = {
        edit: value,
        hasOverride,
        isEditable,
        view: newValue,
      }
    }
  }

  return result as SATableRow[]
}

export function sumColumns(tableData: Record<string, any>) {
  const result: Record<string, number | string> = {
    adj_un_soa: 0,
    annual_contributions: 0,
    un_soa: 0,
  }

  for (let i = 0; i < tableData.length; i++) {
    if (!tableData[i].hasOwnProperty('override_adj_un_soa')) {
      ;(result.un_soa as number) += getOverrideOrDefault(
        tableData[i],
        'un_soa',
      ) as number
    }
    ;(result.adj_un_soa as number) += getOverrideOrDefault(
      tableData[i],
      'adj_un_soa',
    ) as number
    ;(result.annual_contributions as number) += getOverrideOrDefault(
      tableData[i],
      'annual_contributions',
    ) as number
  }

  result.un_soa =
    result.un_soa.toLocaleString('en-US', {
      maximumFractionDigits: MAX_DECIMALS,
      minimumFractionDigits: MIN_DECIMALS,
    }) + '%'
  result.adj_un_soa =
    result.adj_un_soa.toLocaleString('en-US', {
      maximumFractionDigits: MAX_DECIMALS,
      minimumFractionDigits: MIN_DECIMALS,
    }) + '%'
  result.annual_contributions = result.annual_contributions.toLocaleString(
    'en-US',
    {
      maximumFractionDigits: MAX_DECIMALS,
      minimumFractionDigits: MIN_DECIMALS,
    },
  )

  return result
}

function currencyNameFieldSorter(
  field: keyof SAContribution,
  direction: -1 | 1,
) {
  return function (a: SAContribution, b: SAContribution) {
    const infinityValue = direction > 0 ? 'Z' : 'A'
    const a_val = (getOverrideOrDefault(a, field) as string) ?? infinityValue
    const b_val = (getOverrideOrDefault(b, field) as string) ?? infinityValue
    return a_val.localeCompare(b_val) * direction
  }
}

function currencyRateFieldSorter(
  field: keyof SAContribution,
  direction: -1 | 1,
) {
  return function (a: SAContribution, b: SAContribution) {
    const infinityValue = direction > 0 ? -Infinity : Infinity
    const a_val = getOverrideOrDefault(a, field) ?? infinityValue
    const b_val = getOverrideOrDefault(b, field) ?? infinityValue
    if (a_val < b_val) {
      return direction
    } else {
      return -direction
    }
  }
}

export function sortSATableData(
  tableData: SAContribution[],
  field: string,
  direction: -1 | 1,
) {
  const result = [...tableData]

  let sorter
  switch (field) {
    case 'ferm_cur':
      sorter = currencyNameFieldSorter(field, direction)
      break
    case 'ferm_rate':
      sorter = currencyRateFieldSorter(field, direction)
      break
    default:
      sorter = getDefaultFieldSorter(field, direction)
  }

  result.sort(sorter)
  return result
}
