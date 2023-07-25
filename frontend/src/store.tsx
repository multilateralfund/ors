'use client'
import React, { createContext, useContext } from 'react'

import {
  StoreApi,
  useStore as useZustandStore,
  createStore as zustandCreateStore,
} from 'zustand'

import { I18nSlice, createI18nSlice } from './slices/createI18nSlice'
import {
  InitialReportsSlice,
  ReportsSlice,
  createReportsSlice,
} from './slices/createReportsSlice'
import { ThemeSlice, createThemeSlice } from './slices/createThemeSlice'
import { UserSlice, createUserSlice } from './slices/createUserSlice'

export type StoreState = {
  i18n: I18nSlice
  reports: ReportsSlice
  theme: ThemeSlice
  user: UserSlice
}

export type InitialStoreState = {
  i18n?: Partial<I18nSlice>
  reports?: InitialReportsSlice
  theme?: Partial<ThemeSlice>
  user?: Partial<UserSlice>
}

let storeInstance: StoreApi<StoreState>

const createStore = (initialState?: InitialStoreState) => {
  storeInstance = zustandCreateStore<StoreState>((set, get) => ({
    i18n: { ...createI18nSlice(set, get, initialState) },
    reports: { ...createReportsSlice(set, get, initialState) },
    theme: { ...createThemeSlice(set, get, initialState) },
    user: { ...createUserSlice(set, get, initialState) },
  }))

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
  const [store] = React.useState(createStore(initialState))

  return (
    <ZustandContext.Provider value={store}>{children}</ZustandContext.Provider>
  )
}

export const getStore = () => storeInstance

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
