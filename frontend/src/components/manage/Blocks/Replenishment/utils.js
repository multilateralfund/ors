import { fixFloat } from '@ors/helpers/Utils/Utils'

import { DECIMALS, PERIODS } from './constants'

export function getPathPeriod(path) {
  let result = null
  const candidate = path.split('/').at(-1)

  for (let i = 0; i < PERIODS.length; i++) {
    if (candidate === PERIODS[i]) {
      result = candidate
      break
    }
  }

  return result
}

export function formatDateValue(value) {
  const intl = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const date = new Date(Date.parse(value))
  return `${date.getDate()}-${intl.format(date).toUpperCase()}-${date.getFullYear()}`
}

export function formatNumberValue(value) {
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: DECIMALS,
  })
}

export function dateForEditField(value) {
  const date = new Date(Date.parse(value))
  let day = date.getDate()
  let month = date.getMonth() + 1
  day = day < 10 ? `0${day}` : day
  month = month < 10 ? `0${month}` : month
  return `${date.getFullYear()}-${month}-${day}`
}

export function numberForEditField(value) {
  return parseFloat(value.replaceAll(',', ''))
}

export function filterTableData(tableData, searchValue) {
  const result = []
  const searchFor = searchValue.toLowerCase()
  for (let i = 0; i < tableData.length; i++) {
    const rowValues = Object.values(tableData[i])

    for (let j = 0; j < rowValues.length; j++) {
      let value = ''

      if (typeof rowValues[j] === 'string') {
        value = rowValues[j]
      } else if (rowValues[j]) {
        value = rowValues[j].toString()
      }

      if (value.toLowerCase().indexOf(searchFor) !== -1) {
        result.push(tableData[i])
        break
      }
    }
  }
  return result
}

export function sortTableData(tableData, field, direction) {
  const result = [...tableData]
  result.sort(function (a, b) {
    const a_val = a[field]
    const b_val = b[field]
    if (typeof a_val === 'string') {
      return a_val.localeCompare(b_val) * direction
    } else {
      if (a_val < b_val) {
        return direction
      } else {
        return -direction
      }
    }
  })
  return result
}

export function computeTableData(tableData, totalReplenishment) {
  const result = new Array(tableData.length)

  let adj_un_soa = 0
  let adj_un_soa_percent = 100

  for (let i = 0; i < tableData.length; i++) {
    if (tableData[i].iso3 !== 'USA') {
      adj_un_soa += fixFloat(tableData[i].un_soa || 0, 30)
    } else {
      adj_un_soa_percent -= fixFloat(tableData[i].un_soa || 0, 30)
    }
  }

  adj_un_soa_percent -= fixFloat(adj_un_soa, 30)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = { ...tableData[i] }

    const un_soa = fixFloat(tableData[i].un_soa || 0, 30)

    if (tableData[i].iso3 === 'USA') {
      result[i].adj_un_soa = un_soa
    } else {
      result[i].adj_un_soa = fixFloat(
        (un_soa / adj_un_soa) * adj_un_soa_percent + un_soa,
        30,
      )
    }

    result[i].annual_contributions = fixFloat(
      (result[i].adj_un_soa * totalReplenishment) / 100,
      30,
    )
    result[i].qual_ferm = (result[i].avg_ir || 100) < 10 ? 1 : 0
    result[i].ferm_cur_amount =
      result[i].qual_ferm && result[i].ferm_rate
        ? result[i].ferm_rate * result[i].annual_contributions
        : null
  }

  return result
}

export function formatTableData(tableData) {
  const result = new Array(tableData.length)

  for (let i = 0; i < tableData.length; i++) {
    result[i] = {}
    const keys = Object.keys(tableData[i])
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      const value = tableData[i][key]
      const valueType = typeof value

      let newValue = value

      if (value === null) {
        newValue = 'N/A'
      } else if (valueType === 'number') {
        newValue = value.toLocaleString('en-US', {
          maximumFractionDigits: 6,
          minimumFractionDigits: 6,
        })
      }

      result[i][key] = newValue
    }
  }

  return result
}

export function sumColumns(tableData) {
  const result = { adj_un_soa: 0, annual_contributions: 0, un_soa: 0 }

  for (let i = 0; i < tableData.length; i++) {
    result.un_soa += fixFloat(parseFloat(tableData[i].un_soa) || 0, 30)
    result.adj_un_soa += fixFloat(parseFloat(tableData[i].adj_un_soa) || 0, 30)
    result.annual_contributions += fixFloat(
      parseFloat(tableData[i].annual_contributions) || 0,
      30,
    )
  }

  result.un_soa = result.un_soa.toLocaleString('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 6,
  })
  result.adj_un_soa = result.adj_un_soa.toLocaleString('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 6,
  })
  result.annual_contributions = result.annual_contributions.toLocaleString(
    'en-US',
    { maximumFractionDigits: 6, minimumFractionDigits: 6 },
  )

  return result
}
