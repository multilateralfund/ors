import { MAX_DECIMALS, MIN_DECIMALS } from './constants'

const RE_PERIOD = new RegExp(/\d{4}-\d{4}/)

export function getPathPeriod(path) {
  let result = null
  const candidate = path.split('/').at(-1)

  if (candidate.match(RE_PERIOD)) {
    result = candidate
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
    maximumFractionDigits: MAX_DECIMALS,
    minimumFractionDigits: MIN_DECIMALS,
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