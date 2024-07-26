import { MAX_DECIMALS, MIN_DECIMALS } from './constants'

const RE_PERIOD = new RegExp(/\d{4}-\d{4}/)

export function makePeriodOptions(periods) {
  const result = []
  for (let i = 0; i < periods.length; i++) {
    const labelComponents = [periods[i].start_year, periods[i].end_year]
    const label = labelComponents.join('-')
    result.push({ label, value: label })
  }
  return result
}

export function getPathPeriod(path) {
  let result = null
  const candidate = path.split('/').at(-1)

  if (candidate.match(RE_PERIOD)) {
    result = candidate
  }

  return result
}

export function formatDateValue(value) {
  if (!value) {
    return null
  }
  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatNumberValue(value, minDigits, maxDigits) {
  if (isNaN(value) || (!value && value !== 0)) {
    return null
  }
  const formatted = parseFloat(value).toLocaleString('en-US', {
    maximumFractionDigits: maxDigits ?? MAX_DECIMALS,
    minimumFractionDigits: minDigits ?? MIN_DECIMALS,
  })
  return formatted === '-0' ? '0' : formatted
}

export function dateForEditField(value) {
  if (!value) {
    return null
  }
  const date = new Date(Date.parse(value))
  return dateForInput(date)
}

export function dateForInput(input) {
  if (!input) {
    return null
  }

  const date = typeof input === 'string' ? new Date(input) : input

  let day = date.getDate()
  let month = date.getMonth() + 1
  day = day < 10 ? `0${day}` : day
  month = month < 10 ? `0${month}` : month
  return `${date.getFullYear()}-${month}-${day}`
}

export function dateFromInput(value) {
  const [year, month, day] = value.split('-')
  return new Date(
    Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)),
  )
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

export function getDefaultFieldSorter(field, direction) {
  return function (a, b) {
    const a_val = a[field]
    const b_val = b[field]

    // Check if the values are dates
    const isDate = (val) => !isNaN(Date.parse(val))

    if (isDate(a_val) && isDate(b_val)) {
      // Convert strings to Date objects if they are dates
      const dateA = new Date(a_val)
      const dateB = new Date(b_val)
      return (dateA - dateB) * direction
    }

    // Handle strings
    if (typeof a_val === 'string' && typeof b_val === 'string') {
      return a_val.localeCompare(b_val) * direction
    }

    // Handle numbers
    if (typeof a_val === 'number' && typeof b_val === 'number') {
      return (a_val - b_val) * direction
    }

    // Default comparison for other types
    if (a_val < b_val) {
      return direction
    } else {
      return -direction
    }
  }
}

export function sortTableData(tableData, field, direction) {
  const result = [...tableData]
  const defaultSorter = getDefaultFieldSorter(field, direction)
  result.sort(defaultSorter)
  return result
}

export function getCountryForIso3(iso3, countries) {
  let result = null
  for (let i = 0; i < countries.length; i++) {
    if (countries[i].iso3 === iso3) {
      result = countries[i]
      break
    }
  }
  return result
}

export async function fetchWithHandling(url, options = {}, csrftoken) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json() // Get the error details
    const error = new Error('Request failed with status ' + response.status)
    error.data = errorData
    throw error
  }
}
