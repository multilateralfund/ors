import { ApiEditBPActivity } from '@ors/types/api_bp_get'

export enum ActionType {
  addActivity = 'addActivity',
  setActiveTab = 'setActiveTab',
  setCurrentYear = 'setCurrentYear',
  setReportingAgency = 'setReportingAgency',
  setReportingOfficer = 'setReportingOfficer',
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
  | {
      payload: number
      type: ActionType.setCurrentYear
    }
  | {
      payload: string
      type: ActionType.setReportingAgency
    }
  | {
      payload: string
      type: ActionType.setReportingOfficer
    }
