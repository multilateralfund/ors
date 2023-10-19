'use client'
import type { InitialStoreState, StoreState } from '@ors/types/store'

import React, { createContext, useContext } from 'react'

import {
  StoreApi,
  useStore as useZustandStore,
  createStore as zustandCreateStore,
} from 'zustand'

import { createCPReportsSlice } from '@ors/slices/createCPReportsSlice'
import { createCacheSlice } from '@ors/slices/createCacheSlice'
import { createCommonSlice } from '@ors/slices/createCommonSlice'
import { createHeaderSlice } from '@ors/slices/createHeaderSlice'
import { createI18nSlice } from '@ors/slices/createI18nSlice'
import { createProjectSlice } from '@ors/slices/createProjectSlice'
import { createThemeSlice } from '@ors/slices/createThemeSlice'
import { createUserSlice } from '@ors/slices/createUserSlice'

let storeInstance: StoreApi<StoreState>

const createStore = (initialState?: InitialStoreState) => {
  storeInstance = zustandCreateStore<StoreState>((set, get) => {
    const args: [
      StoreApi<StoreState>['setState'],
      StoreApi<StoreState>['getState'],
      InitialStoreState | undefined,
    ] = [set, get, initialState]
    return {
      cache: { ...createCacheSlice(...args) },
      common: { ...createCommonSlice(...args) },
      connection: __CLIENT__
        ? // @ts-ignore
          navigator?.connection?.effectiveType || null
        : null,
      cp_reports: { ...createCPReportsSlice(...args) },
      header: { ...createHeaderSlice(...args) },
      i18n: { ...createI18nSlice(...args) },
      projects: { ...createProjectSlice(...args) },
      theme: { ...createThemeSlice(...args) },
      user: { ...createUserSlice(...args) },
    }
  })

  return storeInstance
}

export const ZustandContext = createContext<StoreApi<StoreState>>(createStore())

export const Provider = ({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState: InitialStoreState
}) => {
  const [store] = React.useState(() => createStore(initialState))

  return (
    <ZustandContext.Provider value={store}>{children}</ZustandContext.Provider>
  )
}

export const getStore = () => storeInstance

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
