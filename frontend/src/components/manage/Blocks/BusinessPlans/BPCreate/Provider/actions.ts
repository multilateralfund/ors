export enum ActionType {
  setActiveTab = 'setActiveTab',
  somethingElse = 'somethingElse',
}

export type BPCreateAction =
  | {
      payload: boolean
      type: ActionType.somethingElse
    }
  | {
      payload: number
      type: ActionType.setActiveTab
    }
