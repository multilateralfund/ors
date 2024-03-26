import { GridApi, RowDataTransaction } from 'ag-grid-community'
import {
  get,
  isArray,
  isFunction,
  isNaN,
  isNil,
  isNull,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  omitBy,
} from 'lodash'

const timer: Record<string, any> = {}

export function removeEmptyValues(
  obj: Record<string, any>,
): Record<string, any> {
  return omitBy(obj, (value) => {
    if (isArray(value)) {
      return value.length === 0
    }
    if (isNumber(value)) {
      return isNaN(value)
    }
    if (isString(value)) {
      return value === ''
    }
    if (isPlainObject(value)) {
      return removeEmptyValues(value)
    }
    return isNil(value)
  })
}

export function parseNumber(number: any) {
  const parsedNumber = isString(number)
    ? parseFloat(number)
    : isNumber(number)
      ? number
      : null
  return isNull(parsedNumber) || isNaN(parsedNumber) ? null : parsedNumber
}

export function applyTransaction(
  api: GridApi,
  transaction: RowDataTransaction<any>,
) {
  try {
    api.applyTransaction(transaction)
  } catch (error) {
    setTimeout(() => {
      api.applyTransaction(transaction)
    }, 0)
  }
}

export function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  )
}

export function debounce(func: any, wait: number = 300, id?: string) {
  if (!isFunction(func)) return
  const name = id || func.name || 'generic'
  if (timer[name]) clearTimeout(timer[name])
  timer[name] = setTimeout(func, wait)
}

export function pendingWorkers(name: string) {
  return !!timer[name]
}

export function scrollToElement(options: {
  behavior?: 'auto' | 'smooth'
  callback?: (el: Element) => void
  element?: Element
  offset?: number
  selectors?: string
  wait?: number
}) {
  const { callback, element, offset = 16, selectors, wait = 0 } = options
  setTimeout(() => {
    const el = element || (selectors ? document.querySelector(selectors) : null)
    if (!el) return
    const visible = isInViewport(el)
    if (visible) {
      callback?.(el)
      return
    }
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    const onScroll = function () {
      debounce(function scrollToElement() {
        if (isInViewport(el)) {
          window.removeEventListener('scroll', onScroll)
          callback?.(el)
        }
      }, 50)
    }
    if (isFunction(callback)) {
      window.addEventListener('scroll', onScroll)
      onScroll()
    }
    window.scrollTo({
      behavior: options.behavior || 'smooth',
      top,
    })
  }, wait)
}

export function getError(props: any) {
  if (props.colDef.category === 'usage') {
    if (isObject(props.data.error)) {
      const errors = get(props.data.error, 'record_usages')
      if (isObject(errors) && !isArray(errors)) {
        const error = get(errors, `usage_${props.colDef.id}`)
        return isObject(error) && !isArray(error)
          ? Object.keys(error).map((key) => error[key])
          : error
      }
      return errors
    }
    return null
  }
  if (isObject(props.data.error)) {
    return get(props.data.error, props.colDef.field)
  }
  if (isString(props.data.error) && props.colDef.showRowError) {
    return props.data.error
  }
  return null
}

export function pxToNumber(px: string) {
  if (px.endsWith('px')) {
    const number = parseNumber(px.replace('px', ''))
    return isNumber(number) ? number : 0
  }
  return 0
}

export const getOSName = () => {
  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform
  const macPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
  const iosPlatforms = ['iPhone', 'iPad', 'iPod']
  const mobilePlatforms = [
    'Android',
    'webOS',
    'Blackberry',
    'WindowsPhone',
    'WindowsCE',
    'Symbian',
  ]

  if (macPlatforms.indexOf(platform) !== -1) {
    return 'mac'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    return 'ios'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'windows'
  } else if (/Android/.test(userAgent)) {
    return 'android'
  } else if (/Linux/.test(platform)) {
    return 'linux'
  } else if (mobilePlatforms.some((mp) => userAgent.indexOf(mp) !== -1)) {
    return 'mobile'
  } else {
    return 'unknown'
  }
}

export const formatDecimalValue = (
  value: number,
  props: {
    maximumFractionDigits?: number
    minimumFractionDigits?: number
  } = {},
) => {
  const maximumFractionDigits = props.maximumFractionDigits || 3
  const minimumFractionDigits =
    props.minimumFractionDigits || props.maximumFractionDigits || 2

  const valueToAvoidRounding =
    Math.round(value * 10 ** maximumFractionDigits) /
    10 ** maximumFractionDigits

  return valueToAvoidRounding.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits,
  })
}
