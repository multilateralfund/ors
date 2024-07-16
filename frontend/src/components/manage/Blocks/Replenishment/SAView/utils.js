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

export function computeTableData(tableData, totalReplenishment, currencies) {
  const result = new Array(tableData.length)

  let adj_un_soa = 0
  let adj_un_soa_percent = 100

  for (let i = 0; i < tableData.length; i++) {
    if (tableData[i].iso3 === 'USA') {
      adj_un_soa_percent -= fixFloat(
        tableData[i].override_un_soa ?? tableData[i].un_soa ?? 0,
        PRECISION,
      )
    } else if (tableData[i].hasOwnProperty('override_adj_un_soa')) {
      adj_un_soa_percent -= fixFloat(
        tableData[i].override_adj_un_soa ?? 0,
        PRECISION,
      )
    } else {
      adj_un_soa += fixFloat(
        tableData[i].override_un_soa ?? tableData[i].un_soa ?? 0,
        PRECISION,
      )
    }
  }

  adj_un_soa_percent -= fixFloat(adj_un_soa, PRECISION)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = { ...tableData[i] }

    const un_soa = fixFloat(
      tableData[i].override_un_soa ?? tableData[i].un_soa ?? 0,
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
      ((result[i].override_adj_un_soa ?? result[i].adj_un_soa) *
        totalReplenishment) /
        100,
      PRECISION,
    )

    // Does it qualify for FERM?
    result[i].qual_ferm =
      (result[i].override_avg_ir ?? result[i].avg_ir ?? 100) < 10 ? true : false
    result[i].qual_ferm =
      result[i].qual_ferm || currencies.idToValue[result[i].ferm_cur] === 'Euro'

    // Calculate contribution in national currency for those qualifying for FERM
    result[i].ferm_cur_amount =
      (result[i].override_qual_ferm ?? result[i].qual_ferm) &&
      (result[i].override_ferm_rate ?? result[i].ferm_rate != null)
        ? (result[i].override_ferm_rate ??
            currencies.idToRate[result[i].ferm_rate]) *
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

export function formatTableData(tableData, editableColumns, currencies) {
  const result = new Array(tableData.length)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = {}
    const keys = Object.keys(tableData[i])
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      const overrideKey = `override_${key}`
      const value = tableData[i][overrideKey] ?? tableData[i][key]
      const hasOverride = tableData[i].hasOwnProperty(overrideKey)

      let isEditable = editableColumns.includes(key)

      let newValue

      // Handle currency display
      if (key === 'ferm_cur' && value !== null) {
        newValue = formattedValue(currencies.idToValue[value])
      } else if (key === 'ferm_rate' && value !== null) {
        newValue = formattedValue(currencies.idToRate[value])
      } else if (key === 'opted_for_ferm' && value == null) {
        newValue = '-'
        isEditable = false
      } else {
        newValue = formattedValue(value)
      }

      if (key === 'adj_un_soa' && tableData[i].iso3 == 'USA') {
        isEditable = false
      }

      if (isEditable) {
        result[i][key] = {
          edit: value,
          isEditable,
          view: (
            <div className="flex items-center justify-between">
              <span
                className={`w-full text-center ${hasOverride ? 'text-secondary' : ''}`}
              >
                {newValue}
              </span>
              <span className="text-gray-400 print:hidden">{'\u22EE'}</span>
            </div>
          ),
        }
      } else {
        result[i][key] = {
          edit: value,
          isEditable,
          view: <div className="text-center">{newValue}</div>,
        }
      }

      // Handle currency edit
      if (key === 'ferm_cur' && value !== null) {
        result[i][key].edit = currencies.idToValue[value]
      } else if (key === 'ferm_rate' && value !== null) {
        result[i][key].edit = currencies.idToRate[value]
      }
    }
  }

  return result
}

export function sumColumns(tableData) {
  const result = { adj_un_soa: 0, annual_contributions: 0, un_soa: 0 }

  for (let i = 0; i < tableData.length; i++) {
    if (!tableData[i].hasOwnProperty('override_adj_un_soa')) {
      result.un_soa += tableData[i].override_un_soa ?? tableData[i].un_soa
    }
    result.adj_un_soa +=
      tableData[i].override_adj_un_soa ?? tableData[i].adj_un_soa
    result.annual_contributions +=
      tableData[i].override_annual_contributions ??
      tableData[i].annual_contributions
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

export function extractCurrencies(tableData) {
  const idToValue = []
  const valueToId = {}
  const idToRate = []
  const r = []

  for (let i = 0; i < tableData.length; i++) {
    const value = tableData[i].ferm_cur
    r.push(tableData[i])
    if (value && valueToId[value] === undefined) {
      const id = idToValue.length
      idToValue.push(value)
      idToRate.push(tableData[i].ferm_rate)
      valueToId[value] = id
    }
    r[i].ferm_cur = valueToId[value] ?? value
    r[i].ferm_rate = valueToId[value] ?? value
  }

  return {
    idToRate,
    idToValue,
    tableData: r,
    valueToId,
  }
}

function currencyNameFieldSorter(field, direction, currencies) {
  function valueGetter(v) {
    return currencies.idToValue[v] ?? v
  }

  return function (a, b) {
    const infinityValue = direction > 0 ? 'Z' : 'A'
    const a_val = valueGetter(a[field]) ?? infinityValue
    const b_val = valueGetter(b[field]) ?? infinityValue
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

function currencyRateFieldSorter(field, direction, currencies) {
  function valueGetter(v) {
    return currencies.idToRate[v] ?? v
  }

  return function (a, b) {
    const infinityValue = direction > 0 ? -Infinity : Infinity
    const a_val = valueGetter(a[field]) ?? infinityValue
    const b_val = valueGetter(b[field]) ?? infinityValue
    if (a_val < b_val) {
      return direction
    } else {
      return -direction
    }
  }
}

export function sortSATableData(tableData, field, direction, currencies) {
  const result = [...tableData]

  let sorter
  switch (field) {
    case 'ferm_cur':
      sorter = currencyNameFieldSorter(field, direction, currencies)
      break
    case 'ferm_rate':
      sorter = currencyRateFieldSorter(field, direction, currencies)
      break
    default:
      sorter = getDefaultFieldSorter(field, direction)
  }

  result.sort(sorter)
  return result
}
