'use client'
import React, { createContext, useContext } from 'react'
import {
  createStore as zustandCreateStore,
  StoreApi,
  useStore as useZustandStore,
} from 'zustand'

import { createReportsSlice, ReportsSlice } from './slices/createReportsSlice'
import { createUserSlice, UserSlice } from './slices/createUserSlice'

type StoreState = {
  theme?: any
  setTheme?: (theme: string) => void
} & UserSlice &
  ReportsSlice

const createStore = (initialState?: StoreState) => {
  return zustandCreateStore<StoreState>((set, get) => ({
    ...createUserSlice(set, get, initialState),
    ...createReportsSlice(set, get),
    theme: initialState?.theme || null,
    setTheme: (theme: string) => set(() => ({ theme })),
  }))
}

export const ZustandContext = createContext<StoreApi<StoreState>>(createStore())

export const Provider = ({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState: StoreState
}) => {
  const [store] = React.useState(createStore(initialState))

  return (
    <ZustandContext.Provider value={store}>{children}</ZustandContext.Provider>
  )
}

export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
