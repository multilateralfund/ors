'use client'
import { createContext, useContext } from 'react'
import { createStore, StoreApi, useStore as useZustandStore } from 'zustand'

import { createUserSlice, UserSlice } from './slices/createUserSlice'

type StoreState = UserSlice

const store = (initialState?: StoreState) => {
  return createStore<StoreState>((set, get) => ({
    ...createUserSlice(set, get, initialState),
  }))
}

export const ZustandContext = createContext<StoreApi<StoreState>>(store())

export const Provider = ({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState: StoreState
}) => {
  return (
    <ZustandContext.Provider value={store(initialState)}>
      {children}
    </ZustandContext.Provider>
  )
}

export default function useStore(selector: (state: StoreState) => any) {
  return useZustandStore(useContext(ZustandContext), selector)
}
