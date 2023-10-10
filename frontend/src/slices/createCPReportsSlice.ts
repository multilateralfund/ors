/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CPReportsSlice, StoreState } from '@ors/types/store'

import { StoreApi } from 'zustand'

import { defaultSliceData } from '@ors/helpers/Store/Store'

export const createCPReportsSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState: any,
): CPReportsSlice => {
  return {
    blends: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.blends || {}),
    },
    substances: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.substances || {}),
    },
    usages: {
      ...defaultSliceData,
      ...(initialState?.cp_reports?.usages || {}),
    },
  }
}
