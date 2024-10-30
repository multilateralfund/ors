import Big, { BigSource } from 'big.js'

import { FileForUpload } from '@ors/components/manage/Blocks/Replenishment/types'

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

// export function asDecimal(value: null, fallback: null): null
// export function asDecimal(value: BigSource | null, fallback: null): Big | null
export function asDecimal(
  value: BigSource | null | undefined,
  fallback: BigSource,
): Big
export function asDecimal(value: BigSource): Big
export function asDecimal(
  value: BigSource | null | undefined,
  fallback: BigSource | null = '0',
) {
  if (!value && value !== 0) {
    return fallback === null ? null : new Big(fallback)
  }
  return new Big(value)
}

export function toFormat(nr: Big, dp: number, ts = ',', ds = '.'): string {
  const arr = nr.toFixed(dp).split('.')
  arr[0] = arr[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts)
  return arr.join(ds)
}

export function formatIso8601DateString(date: string) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jun',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const [year, month, day] = date.split('-')
  const fmtDay = parseInt(day, 10)
  const fmtMonth = months[parseInt(month, 10) - 1]

  return `${fmtDay} ${fmtMonth} ${year}`
}

export function encodeFileForUpload(file: File) {
  function resolver(resolve: (value: FileForUpload) => void) {
    const r = new FileReader()
    r.onload = function (evt) {
      const read = evt.target?.result
      if (read) {
        resolve({
          contentType: file.type,
          data: (read as string).split(',')[1],
          encoding: 'base64',
          filename: file.name,
        })
      }
    }
    r.readAsDataURL(file)
  }

  return new Promise<FileForUpload>(resolver)
}

export function formatDateForDisplay(date: null | string, emptyString = '-') {
  return date ? formatIso8601DateString(date) : emptyString
}
