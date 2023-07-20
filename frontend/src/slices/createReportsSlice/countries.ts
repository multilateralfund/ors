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

export interface CountriesSlice {
  get: SliceData
  getCountries?: (params?: AnyObject | undefined) => void
}

export interface InitialCountriesSlice {
  get?: Partial<SliceData>
}

export const createCountriesSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): CountriesSlice => ({
  get: {
    ...defaultSliceData,
    ...(initialState?.reports?.countries?.get || {}),
  },
  getCountries: async (params) => {
    const prevCountries = get().reports.countries || {}
    const getSliceData = {
      ...(prevCountries.get || defaultSliceData),
    }
    try {
      set((state) => ({
        reports: {
          ...state.reports,
          countries: {
            ...prevCountries,
            get: { ...getSliceData, ...getPendingSliceData() },
          },
        },
      }))
      const countries = await api(
        `api/countries/${
          params ? `?${new URLSearchParams(params).toString()}` : ''
        }`,
      )
      set((state) => ({
        reports: {
          ...state.reports,
          countries: {
            ...prevCountries,
            get: { ...getSliceData, ...getSuccessSliceData(countries) },
          },
        },
      }))
    } catch (error) {
      set((state) => ({
        reports: {
          ...state.reports,
          countries: {
            ...prevCountries,
            get: { ...getSliceData, ...getErrorSliceData(error) },
          },
        },
      }))
    }
  },
})
