import { ApiBPActivity } from '@ors/types/api_bp_get'

import { Dispatch, ReactNode, SetStateAction } from 'react'

export type BpPathParams = {
  agency: string
  period: string
}

export type BpDiffPathParams = {
  version: string
} & BpPathParams

export type BPDataInterface = {
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
  setForm: Dispatch<SetStateAction<Array<ApiBPActivity>>>
} & BPDataInterface

export type ViewSelectorValuesType = 'list' | 'table'
