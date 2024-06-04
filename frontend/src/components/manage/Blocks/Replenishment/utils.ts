import { PERIODS } from './constants'

export function getPathPeriod(path: string) {
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
