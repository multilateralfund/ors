import { ApiEditBPActivity } from '@ors/types/api_bp_get'

export enum ActionType {
  addActivity = 'addActivity',
  setActiveTab = 'setActiveTab',
}

export type BPCreateAction =
  | {
      payload: ApiEditBPActivity[]
      type: ActionType.addActivity
    }
  | {
      payload: number
      type: ActionType.setActiveTab
    }
