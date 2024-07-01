import { fixFloat } from '@ors/helpers/Utils/Utils'

import { MAX_DECIMALS, MIN_DECIMALS, PRECISION } from '../constants'

export { getCountryForIso3, sortTableData } from '../utils'

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

export function computeTableData(tableData, totalReplenishment) {
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
    result[i].qual_ferm =
      (result[i].override_avg_ir ?? result[i].avg_ir ?? 100) < 10 ? true : false
    result[i].ferm_cur_amount =
      (result[i].override_qual_ferm ?? result[i].qual_ferm) &&
      (result[i].override_ferm_rate ?? result[i].ferm_rate)
        ? (result[i].override_ferm_rate ?? result[i].ferm_rate) *
          result[i].annual_contributions
        : null
  }

  return result
}

export function formatTableData(tableData, editableColumns) {
  const result = new Array(tableData.length)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = {}
    const keys = Object.keys(tableData[i])
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      const overrideKey = `override_${key}`
      const value = tableData[i][overrideKey] ?? tableData[i][key]
      const hasOverride = tableData[i].hasOwnProperty(overrideKey)
      const valueType = typeof value

      let newValue = value

      if (value === null) {
        newValue = 'N/A'
      } else if (valueType === 'number') {
        newValue = value.toLocaleString('en-US', {
          maximumFractionDigits: MAX_DECIMALS,
          minimumFractionDigits: MIN_DECIMALS,
        })
      } else if (value === false) {
        newValue = 'No'
      } else if (value === true) {
        newValue = 'Yes'
      }

      if (editableColumns.includes(key)) {
        result[i][key] = {
          edit: value,
          view: (
            <div className="flex items-center justify-between">
              <span
                className={`w-full text-center ${hasOverride ? 'text-secondary' : ''}`}
              >
                {newValue}
              </span>
              <span className="text-gray-400">{'\u22EE'}</span>
            </div>
          ),
        }
      } else {
        result[i][key] = {
          edit: value,
          view: <div className="text-center">{newValue}</div>,
        }
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
