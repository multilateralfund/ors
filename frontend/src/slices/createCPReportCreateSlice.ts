/* eslint-disable @typescript-eslint/no-unused-vars */
import { StoreApi } from 'zustand/esm'

import { StoreState } from '@ors/store'
import {
  SectionD,
  SectionE,
  SectionF,
  Sections,
  SectionsData,
} from '@ors/types'

export interface CPReportCreateSlice {
  reset?: () => void
  section_d: SectionD
  section_e: SectionE
  section_f: SectionF
  update?: (section: Sections, data: SectionsData) => void
}

const initialState = {
  section_d: [
    {
      id: 18,
      all_uses: 0,
      destruction: 0,
      display_name: 'HFC-23',
      feedstock: 0,
    },
  ],
  section_e: [],
  section_f: {
    remarks: '',
  },
}

export const createCPReportCreateSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  _: any,
): CPReportCreateSlice => {
  return {
    reset: () => {
      set((state) => ({
        cp_report_create: {
          reset: state.cp_report_create.reset,
          update: state.cp_report_create.update,
          ...initialState,
        },
      }))
    },
    update: (section, data) => {
      set((state) => ({
        cp_report_create: { ...state.cp_report_create, [section]: data },
      }))
    },
    ...initialState,
  }
}
