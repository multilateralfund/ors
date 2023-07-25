import { StoreApi } from 'zustand'

import { api } from '@ors/helpers'
// TODO: Fix strange behaviour when importin defaultSliceData from '@ors/helpers'
import {
  defaultSliceData,
  getErrorSliceData,
  getPendingSliceData,
  getSuccessSliceData,
} from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { Params, SliceData } from '@ors/types/primitives'

import { BlendsSlice, InitialBlendsSlice, createBlendsSlice } from './blends'
import {
  CountriesSlice,
  InitialCountriesSlice,
  createCountriesSlice,
} from './countries'
import {
  InitialSubstancesSlice,
  SubstancesSlice,
  createSubstancesSlice,
} from './substances'
import { InitialUsagesSlice, UsagesSlice, createUsagesSlice } from './usages'

export interface ReportsSlice {
  blends: BlendsSlice
  countries: CountriesSlice
  get: SliceData
  getReports?: (params?: Params) => void
  substances: SubstancesSlice
  usages: UsagesSlice
}

export interface InitialReportsSlice {
  blends?: InitialBlendsSlice
  countries?: InitialCountriesSlice
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
  countries: createCountriesSlice(set, get, initialState),
  get: {
    ...defaultSliceData,
  },
  // Get reports
  getReports: async (params) => {
    const getSliceData = {
      ...(get().reports?.get || defaultSliceData),
    }
    try {
      set((state) => ({
        reports: {
          ...state.reports,
          get: { ...getSliceData, ...getPendingSliceData() },
        },
      }))
      const reports = await api(
        `api/country-programme/reports/${
          params ? `?${new URLSearchParams(params).toString()}` : ''
        }`,
        { delay: 300 },
      )
      set((state) => ({
        reports: {
          ...state.reports,
          get: { ...getSliceData, ...getSuccessSliceData(reports) },
        },
      }))
    } catch (error) {
      set((state) => ({
        reports: {
          ...state.reports,
          get: { ...getSliceData, ...getErrorSliceData(error) },
        },
      }))
    }
  },
  substances: createSubstancesSlice(set, get, initialState),
  usages: createUsagesSlice(set, get, initialState),
})
