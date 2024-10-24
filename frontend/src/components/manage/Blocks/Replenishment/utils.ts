import { MAX_DECIMALS, MIN_DECIMALS } from './constants'

const RE_PERIOD = new RegExp(/\d{4}-\d{4}/)

export function makePeriodOptions(
  periods: { end_year: number; start_year: number }[],
) {
  const result = []
  for (let i = 0; i < periods.length; i++) {
    const labelComponents = [periods[i].start_year, periods[i].end_year]
    const label = labelComponents.join('-')
    result.push({ label, value: label })
  }
  return result
}

export function getPathPeriod(path: string) {
  let result = null
  const candidate = path.split('/').at(-1)

  if (candidate && candidate.match(RE_PERIOD)) {
    result = candidate
  }

  return result
}

export function formatDateValue(value?: null | string) {
  if (!value) {
    return null
  }
  return new Date(value).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatNumberValue(
  value: null | number | string,
  minDigits?: number,
  maxDigits?: number,
) {
  if ((typeof value === 'number' && isNaN(value)) || (!value && value !== 0)) {
    return null
  }
  const formatted = parseFloat(value as string).toLocaleString('en-US', {
    maximumFractionDigits: maxDigits ?? MAX_DECIMALS,
    minimumFractionDigits: minDigits ?? MIN_DECIMALS,
  })
  return formatted === '-0' ? '0' : formatted
}

export function dateForEditField(value?: null | string) {
  if (!value) {
    return null
  }
  const date = new Date(Date.parse(value))
  return dateForInput(date)
}

export function dateForInput(input: Date): string
export function dateForInput(input: null | string): null | string
export function dateForInput(input?: Date | null | string): null | string {
  if (!input) {
    return null
  }

  const date = typeof input === 'string' ? new Date(input) : input

  let day: number | string = date.getDate()
  let month: number | string = date.getMonth() + 1

  day = day < 10 ? `0${day}` : day
  month = month < 10 ? `0${month}` : month

  return `${date.getFullYear()}-${month}-${day}`
}

export function dateFromInput(value: string) {
  const [year, month, day] = value.split('-')
  return new Date(
    Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)),
  )
}

export function numberForEditField(value: string) {
  return parseFloat(value.replaceAll(',', ''))
}

export function filterTableData(
  tableData: Record<string, number | string>[],
  searchValue: string,
) {
  const result = []
  const searchFor = searchValue.toLowerCase()
  for (let i = 0; i < tableData.length; i++) {
    const rowValues = Object.values(tableData[i])

    for (let j = 0; j < rowValues.length; j++) {
      let value = ''

      if (typeof rowValues[j] === 'string') {
        value = rowValues[j] as string
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

export function getDefaultFieldSorter(field: string, direction: -1 | 1) {
  return function (a: Record<string, any>, b: Record<string, any>) {
    const a_val = a[field]
    const b_val = b[field]

    // Check if the values are dates
    const isDate = (val: string) => !isNaN(Date.parse(val))

    if (isDate(a_val) && isDate(b_val)) {
      // Convert strings to Date objects if they are dates
      const dateA = new Date(a_val)
      const dateB = new Date(b_val)
      return (dateA.getTime() - dateB.getTime()) * direction
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

export function sortTableData(
  tableData: Record<string, any>[],
  field: string,
  direction: -1 | 1,
) {
  const result = [...tableData]
  const defaultSorter = getDefaultFieldSorter(field, direction)
  result.sort(defaultSorter)
  return result
}

export async function fetchWithHandling(
  url: string,
  options: Record<string, any> = {},
  csrftoken?: string,
) {
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
    error.message = errorData
    throw error
  }
}

export const getOrdinalNumberLabel = (number: string) => {
  const parsedNumber = parseInt(number)

  const lastDigit = parsedNumber % 10
  const secondToLastDigit = Math.floor((parsedNumber % 100) / 10)

  let ordinalSuffix = 'th'

  if (secondToLastDigit !== 1) {
    switch (lastDigit) {
      case 1:
        ordinalSuffix = 'st'
        break
      case 2:
        ordinalSuffix = 'nd'
        break
      case 3:
        ordinalSuffix = 'rd'
        break
    }
  }

  return number + ordinalSuffix
}

export function floorSmallValue(
  value: number,
  upperLimit = 5,
  lowerLimit = -5,
) {
  let result = value
  if (value >= lowerLimit && value <= upperLimit) {
    result = 0
  }
  return result
}
