import { ApiEditBPActivity } from '@ors/types/api_bp_get'

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
  form: Array<ApiEditBPActivity>
  loading: boolean
  params: any
  setForm: Dispatch<SetStateAction<Array<ApiEditBPActivity> | null | undefined>>
}

export interface EditBPLocalStorageType {
  clear: () => void
  load: () => Array<ApiEditBPActivity> | undefined
  update: (form: Array<ApiEditBPActivity> | undefined) => void
}

export interface BPRestoreEditProps {
  localStorage: EditBPLocalStorageType
  setForm: (form: Array<ApiEditBPActivity> | undefined) => void
}

export interface ILSBPDataEdit {
  bp_id?: number
  form: Array<ApiEditBPActivity> | undefined
}

export type ViewSelectorValuesType = 'list' | 'table'
