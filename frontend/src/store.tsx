'use client'
import React, { createContext, useContext } from 'react'

import {
  StoreApi,
  useStore as useZustandStore,
  createStore as zustandCreateStore,
} from 'zustand'

import {
  InitialReportsSlice,
  ReportsSlice,
  createReportsSlice,
} from './slices/createReportsSlice'
import { UserSlice, createUserSlice } from './slices/createUserSlice'

export type StoreState = {
  reports: ReportsSlice
  setTheme?: (theme: string) => void
  theme: any
  user: UserSlice
}

export type InitialStoreState = {
  reports?: InitialReportsSlice
  theme?: any
  user?: Partial<UserSlice>
}

const createStore = (initialState?: InitialStoreState) => {
  return zustandCreateStore<StoreState>((set, get) => ({
    reports: { ...createReportsSlice(set, get, initialState) },
    setTheme: (theme: string) => set(() => ({ theme })),
    theme: initialState?.theme || null,
    user: { ...createUserSlice(set, get, initialState) },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
