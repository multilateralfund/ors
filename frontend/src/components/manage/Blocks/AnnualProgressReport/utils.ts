import dayjs from 'dayjs'
import { isNil } from 'lodash'

export function formatDate(value: any, format = 'DD/MM/YYYY') {
  if (isNil(value)) {
    return ''
  }

  return dayjs(value).format(format)
}

export function parseDate(value: string | undefined, format = 'YYYY-MM-DD') {
  if (isNil(value)) return undefined
  const parsed = dayjs(value, format)
  return parsed.isValid() ? parsed.toDate() : undefined
}

export function formatNumber(value: any, options: Intl.NumberFormatOptions) {
  if (isNil(value)) {
    return ''
  }

  const n = Number(value)
  if (isNaN(n) || !isFinite(n)) {
    return ''
  }

  return new Intl.NumberFormat('en-US', options).format(n)
}

export function formatUSD(value: any) {
  return formatNumber(value, {
    style: 'currency',
    currency: 'USD',
  })
}

export function formatDecimal(value: any) {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatPercent(value: any) {
  return formatNumber(value, {
    maximumFractionDigits: 2,
    style: 'unit',
    unit: 'percent',
  })
}

export function formatBoolean(value: any) {
  if (isNil(value)) {
    return ''
  }

  if (value) {
    return 'Yes'
  }

  return 'No'
}
