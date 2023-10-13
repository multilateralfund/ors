import { GridApi, RowDataTransaction } from 'ag-grid-community'
import { isFunction, isNaN, isNull, isNumber, isString } from 'lodash'

const timer: Record<string, any> = {}

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

export function debounce(func: any, wait: number = 300) {
  if (!isFunction(func)) return
  const name = func.name || 'generic'
  if (timer[name]) clearTimeout(timer[name])
  timer[name] = setTimeout(func, wait)
}

export function scrollToElement(
  id: string,
  callback: any,
  wait: number = 0,
  offset: number = 16,
) {
  setTimeout(() => {
    const el = document.querySelector(id)
    if (!el) return
    const visible = isInViewport(el)
    if (visible) {
      if (isFunction(callback)) {
        callback()
      }
      return
    }
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    const onScroll = function () {
      debounce(function scrollToElement() {
        if (isInViewport(el)) {
          window.removeEventListener('scroll', onScroll)
          callback()
        }
      }, 50)
    }
    if (isFunction(callback)) {
      window.addEventListener('scroll', onScroll)
      onScroll()
    }
    window.scrollTo({
      behavior: 'smooth',
      top,
    })
  }, wait)
}
