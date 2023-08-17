import { StoreApi } from 'zustand'

import {
  defaultSliceData,
  // getErrorSliceData,
  // getPendingSliceData,
  // getSuccessSliceData,
} from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { SliceData } from '@ors/types/primitives'

import { BlendsSlice, InitialBlendsSlice, createBlendsSlice } from './blends'
import {
  InitialSubstancesSlice,
  SubstancesSlice,
  createSubstancesSlice,
} from './substances'
import { InitialUsagesSlice, UsagesSlice, createUsagesSlice } from './usages'

export interface ReportsSlice {
  blends: BlendsSlice
  form?: Record<string, any>
  get: SliceData
  substances: SubstancesSlice
  usages: UsagesSlice
}

export interface InitialReportsSlice {
  blends?: InitialBlendsSlice
  get?: Partial<SliceData>
  substances?: InitialSubstancesSlice
  usages?: InitialUsagesSlice
}

export const createReportsSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ReportsSlice => ({
  blends: createBlendsSlice(set, get, initialState),
  form: {},
  get: {
    ...defaultSliceData,
  },
  substances: createSubstancesSlice(set, get, initialState),
  usages: createUsagesSlice(set, get, initialState),
})
