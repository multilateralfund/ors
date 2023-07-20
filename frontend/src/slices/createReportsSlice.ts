import { StoreApi } from 'zustand'

import { AnyObject } from '@ors/@types/primitives'
import api from '@ors/helpers/Api/Api'

export interface ReportsSlice {
  reports?: {
    data: AnyObject | null | undefined
    getReports?: (params: AnyObject) => void
  }
}

export const createReportsSlice = (
  set: StoreApi<ReportsSlice>['setState'],
): ReportsSlice => ({
  reports: {
    data: undefined,
    // Get reports
    getReports: async (params) => {
      try {
        const reports = await api(
          `api/country-programme/reports/${
            params ? `?${new URLSearchParams(params).toString()}` : ''
          }`,
        )
        set((state) => ({
          reports: {
            ...state.reports,
            data: reports,
          },
        }))
      } catch (error) {
        set((state) => ({
          reports: {
            ...state.reports,
            data: null,
          },
        }))
      }
    },
  },
})
