import COUNTRIES from './countries'

export const DECIMALS = 5

export const PERIODS = [
  '2024-2026',
  // '2021-2023',
  // '2018-2020',
  // '2015-2017',
  // '2012-2014',
  // '2009-2011',
  // '2006-2008',
  // '2003-2005',
  // '2000-2002',
  // '1997-1999',
  // '1994-1996',
  // '1991-1993',
]

function asOptions(strings) {
  const result = []
  for (let i = 0; i < strings.length; i++) {
    result.push({ label: strings[i], value: strings[i] })
  }
  return result
}

export const PERIODS_AS_OPTIONS = asOptions(PERIODS)

export const PERIOD = PERIODS[0]

export { COUNTRIES }
