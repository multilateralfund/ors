import { StoreApi } from 'zustand'

import { AnyObject, SliceData } from '@ors/@types/primitives'
import api from '@ors/helpers/Api/Api'
import {
  defaultSliceData,
  getErrorSliceData,
  getPendingSliceData,
  getSuccessSliceData,
} from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'

import { BlendsSlice, createBlendsSlice, InitialBlendsSlice } from './blends'
import {
  CountriesSlice,
  createCountriesSlice,
  InitialCountriesSlice,
} from './countries'
import {
  createSubstancesSlice,
  InitialSubstancesSlice,
  SubstancesSlice,
} from './substances'
import { createUsagesSlice, InitialUsagesSlice, UsagesSlice } from './usages'

export interface ReportsSlice {
  get: SliceData
  blends: BlendsSlice
  countries: CountriesSlice
  substances: SubstancesSlice
  usages: UsagesSlice
  getReports?: (params?: AnyObject | undefined) => void
}

export interface InitialReportsSlice {
  get?: Partial<SliceData>
  blends?: InitialBlendsSlice
  countries?: InitialCountriesSlice
  substances?: InitialSubstancesSlice
  usages?: InitialUsagesSlice
}

export const createReportsSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ReportsSlice => ({
  get: {
    ...defaultSliceData,
  },
  blends: createBlendsSlice(set, get, initialState),
  countries: createCountriesSlice(set, get, initialState),
  substances: createSubstancesSlice(set, get, initialState),
  usages: createUsagesSlice(set, get, initialState),
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
})
