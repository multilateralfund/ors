import { ApiBP, ApiBPActivity } from '@ors/types/api_bp_get'

import { Dispatch, ReactNode, SetStateAction } from 'react'

export type BpPathParams = {
  agency: string
  period: string
}

export type BpDiffPathParams = {
  version: string
} & BpPathParams

export interface BPDataInterface {
  loaded: boolean
  loading: boolean
  results: Array<any>
}

export type BPGetVersionsInterface = {
  agency_id: number
  year_end: number
  year_start: number
}

export type BPGetDiffInterface = {
  version: string
} & BPGetVersionsInterface

export type BPTabsInterface = {
  activeTab: number
  children: ReactNode
  setActiveTab: Dispatch<SetStateAction<number>>
}

export type BPEditTableInterface = {
  form: Array<ApiBPActivity>
  loading: boolean
  params: any
  setForm: Dispatch<SetStateAction<Array<ApiBPActivity> | null | undefined>>
}

export type ViewSelectorValuesType = 'list' | 'table'
