import Big from 'big.js'

import { MAX_DECIMALS, MIN_DECIMALS } from '../constants'
import { getDefaultFieldSorter, toFormat } from '../utils'
import { SAContribution, SATableRow } from './types'

export function clearNew(d: Record<string, any>) {
  const r = []
  for (let i = 0; i < d.length; i++) {
    r.push(d[i])
    delete r[i].isNew
  }
  return r
}

export function getOverrideOrDefault<T = SAContribution[keyof SAContribution]>(
  record: SAContribution,
  name: keyof SAContribution,
): T {
  const overrideKey = `override_${name}` as keyof SAContribution
  let result = record[overrideKey] as T
  if (result === undefined) {
    result = record[name] as T
  }
  return result
}

export function computeTableData(
  tableData: SAContribution[],
  totalReplenishment: Big,
) {
  const result = new Array(tableData.length)

  let adj_un_soa = new Big('0')
  let adj_un_soa_percent = new Big('100')

  for (let i = 0; i < tableData.length; i++) {
    if (tableData[i].iso3 === 'USA') {
      adj_un_soa_percent = adj_un_soa_percent.minus(
        getOverrideOrDefault<Big | null>(tableData[i], 'un_soa') ??
          new Big('0'),
      )
    } else {
      adj_un_soa = adj_un_soa.plus(
        getOverrideOrDefault<Big | null>(tableData[i], 'un_soa') ??
          new Big('0'),
      )
    }
  }

  adj_un_soa_percent = adj_un_soa_percent.minus(adj_un_soa)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = { ...tableData[i] }

    const un_soa =
      getOverrideOrDefault<Big | null>(tableData[i], 'un_soa') ?? new Big('0')

    if (tableData[i].iso3 === 'USA') {
      result[i].adj_un_soa = un_soa
    } else {
      result[i].adj_un_soa = un_soa
        .div(adj_un_soa)
        .mul(adj_un_soa_percent)
        .plus(un_soa)
    }

    result[i].annual_contributions = (
      getOverrideOrDefault<Big | null>(result[i], 'adj_un_soa') ?? Big('0')
    )
      .mul(totalReplenishment)
      .div(100)

    // Does it qualify for FERM?
    result[i].qual_ferm = checkQualifiesForFerm(result[i])

    // Calculate contribution in national currency for those qualifying for FERM
    result[i].ferm_cur_amount =
      getOverrideOrDefault(result[i], 'qual_ferm') &&
      getOverrideOrDefault(result[i], 'ferm_rate') !== null
        ? getOverrideOrDefault<Big>(result[i], 'ferm_rate').mul(
            result[i].annual_contributions,
          )
        : null
  }

  return result
}

function formattedValue(value: Big | boolean | null | number | string) {
  let newValue = value

  if (value === null) {
    newValue = 'N/A'
  } else if (typeof value === 'number') {
    newValue = value.toLocaleString('en-US', {
      maximumFractionDigits: MAX_DECIMALS,
      minimumFractionDigits: MIN_DECIMALS,
    })
  } else if (value instanceof Big) {
    newValue = toFormat(value, MIN_DECIMALS)
  } else if (value === false) {
    newValue = 'No'
  } else if (value === true) {
    newValue = 'Yes'
  }

  return newValue
}

export function formatTableData(
  tableData: SAContribution[],
  editableColumns: string[] = [],
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
      } else if (key === 'ferm_cur' && !value) {
        newValue = '-'
      } else if (key === 'un_soa' && value === null) {
        newValue = ''
      } else {
        newValue = value !== undefined ? formattedValue(value) : value
      }

      const usNonEditableColumns = ['adj_un_soa', 'opted_for_ferm']
      if (tableData[i].iso3 == 'USA' && usNonEditableColumns.includes(key)) {
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
  const _result = {
    adj_un_soa: new Big('0'),
    annual_contributions: new Big('0'),
    un_soa: new Big('0'),
  }

  for (let i = 0; i < tableData.length; i++) {
    if (!tableData[i].hasOwnProperty('override_adj_un_soa')) {
      _result.un_soa = _result.un_soa.plus(
        getOverrideOrDefault<Big | null>(tableData[i], 'un_soa') ??
          new Big('0'),
      )
    }
    _result.adj_un_soa = _result.adj_un_soa.plus(
      getOverrideOrDefault<Big | null>(tableData[i], 'adj_un_soa') ??
        new Big('0'),
    )

    _result.annual_contributions = _result.annual_contributions.plus(
      getOverrideOrDefault<Big | null>(tableData[i], 'annual_contributions') ??
        new Big('0'),
    )
  }

  return {
    adj_un_soa: toFormat(_result.adj_un_soa, MIN_DECIMALS),
    annual_contributions: toFormat(_result.annual_contributions, MIN_DECIMALS),
    un_soa: toFormat(_result.un_soa, MIN_DECIMALS),
  }
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

export function checkQualifiesForFerm(entry: SAContribution) {
  let result = false
  if (entry.iso3 === 'USA') {
    result = false
  } else if (entry.ferm_cur === 'Euro') {
    result = true
  } else {
    result = (
      getOverrideOrDefault<Big | null>(entry, 'avg_ir') ?? new Big('100')
    ).lt(new Big('10'))
  }
  return result
}
