import resolveConfig from 'tailwindcss/resolveConfig'
import { StoreApi } from 'zustand'

import { InitialStoreState, StoreState } from '@ors/store'

const tailwindConfigModule = require('@ors/../tailwind.config')
const tailwindConfig = resolveConfig(tailwindConfigModule)

export interface HeaderSlice {
  HeaderTitle: React.FC | React.ReactNode | null
  navigationBackground: string
  setHeaderTitleComponent?: (
    component: React.FC | React.ReactNode | null,
  ) => void
  setNavigationBackground?: (value: string) => void
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
    setHeaderTitleComponent: (component) => {
      set((state) => {
        return {
          header: {
            ...state.header,
            HeaderTitle: component || null,
          },
        }
      })
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
