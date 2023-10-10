import type {
  HeaderSlice,
  InitialStoreState,
  StoreState,
} from '@ors/types/store'

import resolveConfig from 'tailwindcss/resolveConfig'
import { StoreApi } from 'zustand'

const tailwindConfigModule = require('@ors/../tailwind.config')
const tailwindConfig = resolveConfig(tailwindConfigModule)

let timer: any

const animateDebounce = (func: () => void) => {
  if (timer) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func()
      timer = undefined
    }, 300)
  } else {
    func()
    timer = setTimeout(() => {
      timer = undefined
    }, 300)
  }
}

const debounce = (func: () => void) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(func, 100)
}

export const createHeaderSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): HeaderSlice => {
  const initialTheme = initialState?.theme?.mode || 'light'
  const initialNavigationBackground =
    tailwindConfig.originalColors[initialTheme].primary.DEFAULT

  return {
    HeaderTitle: initialState?.header?.HeaderTitle || null,
    navigationBackground: initialNavigationBackground,
    setHeaderTitleComponent: (component, animate = true) => {
      function updateHeader() {
        set((state) => {
          return {
            header: {
              ...state.header,
              HeaderTitle: component || null,
            },
          }
        })
      }
      if (animate) {
        animateDebounce(updateHeader)
      } else {
        debounce(updateHeader)
      }
    },
    setNavigationBackground: (value) => {
      set((state) => {
        return {
          header: {
            ...state.header,
            navigationBackground: value || initialNavigationBackground,
          },
        }
      })
    },
  }
}
