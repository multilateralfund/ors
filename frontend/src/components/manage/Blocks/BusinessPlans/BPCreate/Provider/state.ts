import { ApiAgency } from '@ors/types/api_agencies'
import { ApiEditBPActivity } from '@ors/types/api_bp_get'
import { ApiBPYearRange } from '@ors/types/api_bp_get_years'

import { Reducer } from 'react'

import {
  ActionType,
  BPCreateAction,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'

export interface BPCreateState {
  activeTab: number
  activities: ApiEditBPActivity[]
  currentYear: number
  reportingAgency: ApiAgency | null
  reportingOfficer: string
  yearRange: ApiBPYearRange
}

export const bpReducer: Reducer<BPCreateState, BPCreateAction> = function (
  state: BPCreateState,
  action: BPCreateAction,
) {
  switch (action.type) {
    case ActionType.setActiveTab:
      return { ...state, activeTab: action.payload }
    case ActionType.addActivity:
      return { ...state, activities: action.payload }
    case ActionType.setReportingOfficer:
      return { ...state, reportingOfficer: action.payload }
    case ActionType.setReportingAgency:
      return { ...state, reportingAgency: action.payload }
    case ActionType.setCurrentYear:
      let currentYear = action.payload
      if (isNaN(currentYear)) {
        currentYear = state.currentYear
      }
      return {
        ...state,
        currentYear,
        get yearRange() {
          const startOn = this.currentYear
          const endOn = startOn + 2
          return {
            max_year: endOn,
            min_year: startOn,
            year_end: endOn,
            year_start: startOn,
          }
        },
      }
    default:
      return { ...state }
  }
}

export function initialState(): BPCreateState {
  return {
    activeTab: 0,
    activities: [],
    currentYear: new Date().getFullYear(),
    reportingAgency: null,
    reportingOfficer: '',
    get yearRange() {
      const startOn = this.currentYear
      const endOn = startOn + 2
      return {
        max_year: endOn,
        min_year: startOn,
        year_end: endOn,
        year_start: startOn,
      }
    },
  }
}
