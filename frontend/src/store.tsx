'use client'
import React, { createContext, useContext } from 'react'
import {
  createStore as zustandCreateStore,
  StoreApi,
  useStore as useZustandStore,
} from 'zustand'

import {
  createReportsSlice,
  InitialReportsSlice,
  ReportsSlice,
} from './slices/createReportsSlice'
import { createUserSlice, UserSlice } from './slices/createUserSlice'

export type StoreState = {
  user: UserSlice
  reports: ReportsSlice
  theme: any
  setTheme?: (theme: string) => void
}

export type InitialStoreState = {
  user?: Partial<UserSlice>
  reports?: InitialReportsSlice
  theme?: any
}

const createStore = (initialState?: InitialStoreState) => {
  return zustandCreateStore<StoreState>((set, get) => ({
    user: { ...createUserSlice(set, get, initialState) },
    reports: { ...createReportsSlice(set, get, initialState) },
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
  initialState: InitialStoreState
}) => {
  const [store] = React.useState(createStore(initialState))

  return (
    <ZustandContext.Provider value={store}>{children}</ZustandContext.Provider>
  )
}

export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
