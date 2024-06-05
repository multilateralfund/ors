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
