import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { Dispatch, ReactNode, SetStateAction } from 'react'

export type BpPathParams = {
  agency: string
  period: string
  status: string
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

export type BpFilesObject = {
  deletedFilesIds?: Array<number>
  newFiles?: Array<File>
}

export type BpFile = {
  agency_id: number
  download_url: string
  filename: string
  id: number
  uploaded_at: string
  year_end: number
  year_start: number
}

export type BpFileInput = {
  files?: BpFilesObject
  setFiles?: React.Dispatch<React.SetStateAction<BpFilesObject>>
  extensionsList?: string
  value?: string
  clearable?: boolean
  inputValue?: []
  accept?: string
  label?: string
}

export interface BpDetails extends BpFileInput {
  bpFiles?: Array<BpFile>
}

export interface BPTabsInterface extends BpDetails {
  activeTab: number
  children: ReactNode
  setActiveTab: Dispatch<SetStateAction<number>>
  isConsolidatedBp?: boolean
  data?: any
  results?: any[]
  bpFiles: any[]
  setBpForm?: Dispatch<any> | undefined
}

export type chemicalTypesType = {
  loading: boolean
  loaded: boolean
  results: { id: number; name: string }[]
}

export type BPEditTableInterface = {
  form: Array<ApiEditBPActivity> | undefined
  isConsolidatedView?: boolean
  loading: boolean
  params: any
  setForm: Dispatch<SetStateAction<Array<ApiEditBPActivity> | null | undefined>>
  chemicalTypes: chemicalTypesType
  activitiesRef?: any
  isDataFormatted?: boolean
  results?: any[]
}

export interface EditBPLocalStorageType {
  clear: () => void
  load: () => Array<ApiEditBPActivity> | undefined
  update: (form: Array<ApiEditBPActivity> | undefined) => void
}

export interface BPRestoreEditProps {
  children: any
  localStorage: EditBPLocalStorageType
  setForm: (form: Array<ApiEditBPActivity> | undefined) => void
  activitiesRef?: any
  results?: any[]
}

export interface ILSBPDataEdit {
  bp_id?: number
  form: Array<ApiEditBPActivity> | undefined
}

export interface INavigationButton {
  direction: string
  isBtnDisabled?: boolean
  setCurrentStep: Dispatch<SetStateAction<number>>
  setCurrentTab?: Dispatch<SetStateAction<number>>
  title?: string
  classname?: string
}

export interface IDecision {
  label: string
  value: string
  meeting: number
}

export type ViewSelectorValuesType = 'list' | 'table'
