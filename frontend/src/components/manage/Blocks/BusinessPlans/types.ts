export type BpPathParams = {
  agency: string
  period: string
}

export type BpDiffPathParams = {
  agency: string
  period: string
  version: string
}

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
  agency_id: number
  version: string
  year_end: number
  year_start: number
}

export type BPDiffHeaderInterface = {
  agency_id: number
  pathParams: BpDiffPathParams
  year_end: number
  year_start: number
}

export type ViewSelectorValuesType = 'list' | 'table'
