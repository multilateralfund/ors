import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { Reducer } from 'react'

import {
  ActionType,
  BPCreateAction,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'

export interface BPCreateState {
  activeTab: number
  form: ApiEditBPActivity[]
}

export const bpReducer: Reducer<BPCreateState, BPCreateAction> = function (
  state: BPCreateState,
  action: BPCreateAction,
) {
  switch (action.type) {
    case ActionType.setActiveTab:
      return { ...state, activeTab: action.payload }
    case ActionType.addActivity:
      return { ...state, form: action.payload }
    default:
      return { ...state }
  }
}

export function initialState(): BPCreateState {
  return {
    activeTab: 0,
    form: [],
  }
}
