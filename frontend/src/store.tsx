'use client'
import type { InitialStoreState, StoreState } from '@ors/types/store'

import {
  MutableRefObject,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { merge } from 'lodash'
import { StoreApi, useStore as useZustandStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { createStore as createZustandStore } from 'zustand/vanilla'

import createSlices from '@ors/slices'

type StoreProviderProps = {
  children: React.ReactNode
  initialState: InitialStoreState
}

export type CreateSliceProps = {
  initialState: InitialStoreState
  get: StoreApi<StoreState>['getState']
  set: StoreApi<StoreState>['setState']
}

export type Store = ReturnType<typeof createStore>

export let store: MutableRefObject<StoreApi<StoreState>>

export const test = {}

export const initialStore = createZustandStore<InitialStoreState>(() => ({}))

export const createStore = (initialState: InitialStoreState) => {
  return createZustandStore<StoreState>((set, get) => ({
    ...createSlices({ initialState, get, set }),
  }))
}

export const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children, initialState }: StoreProviderProps) {
  const [, setMounted] = useState(false)
  // Set initial store state
  initialStore.setState(initialState)
  // Hydrate store with initial state
  store = useRef(createStore(initialStore.getState()))
  // Re-hydrate store with new initial state
  const unsubscribeRehydrate = initialStore.subscribe((state, prevState) => {
    if (JSON.stringify(state) !== JSON.stringify(prevState)) {
      store.current.setState(merge(store.current.getState(), state))
    }
  })

  useEffect(() => {
    // Unsubscribe store re-hydration on initial render and trigger rerender
    unsubscribeRehydrate()
    setMounted(true)
    /* eslint-disable-next-line */
  }, [])

  return (
    <StoreContext.Provider value={store.current}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore<S>(selector: (state: StoreState) => S) {
  const store = useContext(StoreContext)
  if (!store) throw new Error('Missing StoreContext.Provider in the tree')
  return useZustandStore(store, useShallow(selector))
}
