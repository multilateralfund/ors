import { fixFloat } from '@ors/helpers/Utils/Utils'

import { MAX_DECIMALS, MIN_DECIMALS, PRECISION } from '../constants'

export { getCountryForIso3 } from '../utils'
import { getDefaultFieldSorter } from '../utils'

export function uniformDecimals(v) {
  let result = null
  if (v !== null) {
    result = fixFloat(v, MAX_DECIMALS)
  }
  return result
}

export function clearNew(d) {
  const r = []
  for (let i = 0; i < d.length; i++) {
    r.push(d[i])
    delete r[i].isNew
  }
  return r
}

export function getOverrideOrDefault(record, name) {
  let result = record[`override_${name}`]
  if (result === undefined) {
    result = record[name]
  }
  return result
}

export function computeTableData(tableData, totalReplenishment) {
  const result = new Array(tableData.length)

  let adj_un_soa = 0
  let adj_un_soa_percent = 100

  for (let i = 0; i < tableData.length; i++) {
    if (tableData[i].iso3 === 'USA') {
      adj_un_soa_percent -= fixFloat(
        getOverrideOrDefault(tableData[i], 'un_soa') ?? 0,
        PRECISION,
      )
    } else {
      adj_un_soa += fixFloat(
        getOverrideOrDefault(tableData[i], 'un_soa') ?? 0,
        PRECISION,
      )
    }
  }

  adj_un_soa_percent -= fixFloat(adj_un_soa, PRECISION)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = { ...tableData[i] }

    const un_soa = fixFloat(
      getOverrideOrDefault(tableData[i], 'un_soa') ?? 0,
      PRECISION,
    )

    if (tableData[i].iso3 === 'USA') {
      result[i].adj_un_soa = un_soa
    } else {
      result[i].adj_un_soa = fixFloat(
        (un_soa / adj_un_soa) * adj_un_soa_percent + un_soa,
        PRECISION,
      )
    }

    result[i].annual_contributions = fixFloat(
      (getOverrideOrDefault(result[i], 'adj_un_soa') * totalReplenishment) /
        100,
      PRECISION,
    )

    // Does it qualify for FERM?
    result[i].qual_ferm =
      (getOverrideOrDefault(result[i], 'avg_ir') ?? 100) < 10 ? true : false
    result[i].qual_ferm = result[i].qual_ferm || result[i].ferm_cur === 'Euro'

    // Calculate contribution in national currency for those qualifying for FERM
    result[i].ferm_cur_amount =
      getOverrideOrDefault(result[i], 'qual_ferm') &&
      getOverrideOrDefault(result[i], 'ferm_rate') !== null
        ? getOverrideOrDefault(result[i], 'ferm_rate') *
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

function formattedValue(value) {
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

export function formatTableData(tableData, editableColumns) {
  const result = new Array(tableData.length)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = {}
    const keys = Object.keys(tableData[i])
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      const overrideKey = `override_${key}`
      const hasOverride = tableData[i].hasOwnProperty(overrideKey)
      const value = hasOverride ? tableData[i][overrideKey] : tableData[i][key]

      let isEditable = editableColumns.includes(key)

      let newValue

      if (key === 'opted_for_ferm' && value == null) {
        newValue = '-'
        isEditable = false
      } else {
        newValue = formattedValue(value)
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

  return result
}

export function sumColumns(tableData) {
  const result = { adj_un_soa: 0, annual_contributions: 0, un_soa: 0 }

  for (let i = 0; i < tableData.length; i++) {
    if (!tableData[i].hasOwnProperty('override_adj_un_soa')) {
      result.un_soa += getOverrideOrDefault(tableData[i], 'un_soa')
    }
    result.adj_un_soa += getOverrideOrDefault(tableData[i], 'adj_un_soa')
    result.annual_contributions += getOverrideOrDefault(
      tableData[i],
      'annual_contributions',
    )
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

function currencyNameFieldSorter(field, direction) {
  return function (a, b) {
    const infinityValue = direction > 0 ? 'Z' : 'A'
    const a_val = getOverrideOrDefault(a, field) ?? infinityValue
    const b_val = getOverrideOrDefault(b, field) ?? infinityValue
    if (typeof a_val === 'string') {
      return a_val.localeCompare(b_val) * direction
    } else {
      if (a_val < b_val) {
        return direction
      } else {
        return -direction
      }
    }
  }
}

function currencyRateFieldSorter(field, direction) {
  return function (a, b) {
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

export function sortSATableData(tableData, field, direction) {
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
