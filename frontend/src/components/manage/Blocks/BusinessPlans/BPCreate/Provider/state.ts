import { Reducer } from 'react'

import {
  ActionType,
  BPCreateAction,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'

export interface BPCreateState {
  activeTab: number
  somethingElseState?: boolean
}

export const bpReducer: Reducer<BPCreateState, BPCreateAction> = function (
  state: BPCreateState,
  action: BPCreateAction,
) {
  switch (action.type) {
    case ActionType.setActiveTab:
      return { ...state, activeTab: action.payload }
    case ActionType.somethingElse:
      return { ...state, somethingElseState: action.payload }
    default:
      return { ...state }
  }
}
