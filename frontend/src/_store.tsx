import type { StoreState } from '@ors/types/store'

import { MutableRefObject } from 'react'

import { StoreApi } from 'zustand'

export let store: MutableRefObject<StoreApi<StoreState>>

export function setStore(value: any) {
  store = value
}
