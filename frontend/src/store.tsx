'use client'
import type {
  InitialStoreState,
  StoreProviderProps,
  StoreState,
} from '@ors/types/store'

import { createContext, useContext, useRef } from 'react'

import { useStore as useZustandStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { createStore as createZustandStore } from 'zustand/vanilla'

import createSlices from '@ors/slices'

import { setStore } from './_store'

export type Store = ReturnType<typeof createStore>

export const createStore = (initialState: InitialStoreState) => {
  return createZustandStore<StoreState>((set, get) => ({
    ...createSlices({ initialState, get, set }),
  }))
}

export const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children, initialState }: StoreProviderProps) {
  const storeRef = useRef<Store | null>(null)

  if (!storeRef.current) {
    storeRef.current = createStore(initialState)
    setStore(storeRef)
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore<S>(selector: (state: StoreState) => S) {
  const store = useContext(StoreContext)
  if (!store) throw new Error('Missing StoreContext.Provider in the tree')
  return useZustandStore(store, useShallow(selector))
}
