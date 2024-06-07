import { PERIODS } from './constants'

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

export function dateForEditField(value) {
  const date = new Date(Date.parse(value))
  let day = date.getDate()
  let month = date.getMonth() + 1
  day = day < 10 ? `0${day}` : day
  month = month < 10 ? `0${month}` : month
  return `${date.getFullYear()}-${month}-${day}`
}

export function filterTableData(tableData, searchValue) {
  const result = []
  const searchFor = searchValue.toLowerCase()
  for (let i = 0; i < tableData.length; i++) {
    const rowValues = Object.values(tableData[i])

    for (let j = 0; j < rowValues.length; j++) {
      const value =
        typeof rowValues[j] === 'string'
          ? rowValues[j]
          : rowValues[j].toString()
      if (value.toLowerCase().indexOf(searchFor) !== -1) {
        result.push(tableData[i])
        break
      }
    }
  }
  return result
}
