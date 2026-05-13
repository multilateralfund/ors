import { enqueueSnackbar } from 'notistack'
import { isNil } from 'lodash'
import dayjs from 'dayjs'

export function formatDate(value: any, format = 'DD/MM/YYYY') {
  if (isNil(value)) {
    return ''
  }

  // ISO to format
  return dayjs(value).format(format)
}

export function parseDate(value: string | undefined) {
  if (isNil(value)) {
    return undefined
  }

  // ISO to Date object
  const parsed = dayjs(value)
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

export function formatFunding(value: any) {
  return formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatDecimal(value: any) {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatOneDecimal(value: any) {
  return formatNumber(value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
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
  if (!value) {
    return 'No'
  }

  return 'Yes'
}

export const handleExport = async (
  url: string,
  setLoading: (loading: boolean) => void,
) => {
  try {
    setLoading(true)

    const response = await fetch(url, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const cd = response.headers.get('content-disposition') ?? ''
    const filename = cd.match(/filename="([^"]+)"/)?.[1] ?? 'export.xlsx'

    const blob = await response.blob()

    const exportUrl = URL.createObjectURL(blob)
    const exportLinkEl = document.createElement('a')
    exportLinkEl.href = exportUrl
    exportLinkEl.download = filename

    document.body.appendChild(exportLinkEl)
    exportLinkEl.click()
    exportLinkEl.remove()
    URL.revokeObjectURL(exportUrl)
  } catch (e) {
    enqueueSnackbar('Export failed. Please try again.', {
      variant: 'error',
    })
  } finally {
    setLoading(false)
  }
}
