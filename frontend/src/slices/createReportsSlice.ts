import { StoreApi } from 'zustand'

import { AnyObject, SliceData } from '@ors/@types/primitives'
import api from '@ors/helpers/Api/Api'
import {
  getDefaultSliceData,
  getErrorSliceData,
  getPendingSliceData,
  getSuccessSliceData,
} from '@ors/helpers/Store/Store'

export interface ReportsSlice {
  reports?: {
    get: SliceData
    getReports?: (params: AnyObject) => void
  }
}

export const createReportsSlice = (
  set: StoreApi<ReportsSlice>['setState'],
  get: StoreApi<ReportsSlice>['getState'],
): ReportsSlice => ({
  reports: {
    get: {
      ...getDefaultSliceData(),
    },
    // Get reports
    getReports: async (params) => {
      const getSliceData = {
        ...(get().reports?.get || getDefaultSliceData()),
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
          { delay: 500 },
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
  },
})
