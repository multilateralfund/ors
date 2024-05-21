import type { CPReport, CPReportDiff } from './api_country-programme_records'
import type { EmptyFormType } from './api_empty-form'
import type { ApiSubstance } from './api_substances'
import { ApiBlend } from '@ors/types/api_blends'
import type { DataType, SliceData } from '@ors/types/primitives'
import type { PartialDeep } from 'type-fest'

import { StoreApi } from 'zustand'

import { ReportVariant } from './variants'
type StoreProviderProps = {
  children: React.ReactNode
  initialState: InitialStoreState
}

export type CreateSliceProps = {
  initialState: InitialStoreState
  get: StoreApi<StoreState>['getState']
  set: StoreApi<StoreState>['setState']
}

type Report = {
  country?: Country
  emptyForm: SliceData<EmptyFormType, Record<string, any> | null>
  files?: SliceData<File[]>
  variant?: ReportVariant
  versions: SliceData<CPVersionInfo[]>
} & SliceData<CPReport | null, Record<string, any> | null>

type ReportDiff = SliceData<CPReportDiff | null, Record<string, any> | null>

export interface SettingsSlice {
  host: null | string
  protocol: null | string
}

export interface CacheSlice {
  data: {
    [key: string]: any
  }
  getCache: (id: string) => any
  removeCache: (id: string) => void
  setCache: (id: string, data: any) => void
}

export interface CPReportsSlice {
  blends: SliceData<ApiBlend[]>
  cacheInvalidate: string[]
  cacheInvalidateReport: (country_id: number, year: number) => void
  fetchArchivedBundle: (report_id: number, view: boolean) => void
  fetchArchivedFiles: (country_id: number) => void
  fetchArchivedReport: (report_id: number) => Promise<void>
  fetchBlends: () => Promise<void>
  fetchBundle: (country_id: number, year: number, view?: boolean) => Promise<void>
  fetchDiffBundle: (country_id: number, year: number) => void
  fetchEmptyForm: (report: CPReport | null, view: boolean) => void
  fetchFiles: (country_id: number, year: number) => void
  fetchReport: (country_id: number, year: number) => Promise<void>
  fetchReportDiff: (country_id: number, year: number, version: number) => void
  fetchVersions: (country_id: number, year: number) => void
  report: Report
  reportDiff: ReportDiff
  setReport: (report: Partial<Report>) => void
  setReportCountry: (report: CPReport) => void
  setReportDiff: (reportDiff: Partial<CPReport>) => void
  setReportVariant: (report: CPReport) => void
  substances: SliceData<ApiSubstance[]>
}

export interface CPCurrentTabSlice {
  activeTab: number
  setActiveTab: (nr: number) => void
}

export interface HeaderSlice {
  HeaderTitle: React.FC | React.ReactNode | null
  navigationBackground: string
  setHeaderTitleComponent: (
    component: React.FC | React.ReactNode | null,
    animate?: boolean,
  ) => void
  setNavigationBackground: (value: string) => void
}

export interface ProjectsSlice {
  clusters: SliceData
  meetings: SliceData
  sectors: SliceData
  statuses: SliceData
  subsectors: SliceData
  types: SliceData
}

export interface BusinessPlanSlice {
  sectors: SliceData
  subsectors: SliceData
  types: SliceData
  yearRanges: SliceData
}

export interface ThemeSlice {
  mode: 'dark' | 'light' | null
  setMode: (mode: 'dark' | 'light' | null) => void
}

export interface UserSlice
  extends SliceData<DataType, Record<string, any> | null | undefined> {
  getUser: () => void
  login: (username: string, password: string) => void
  logout: () => Promise<void>
}

export interface CommonSlice {
  agencies: SliceData
  countries: SliceData<Country[]>
  countries_for_create: SliceData<Country[]>
  countries_for_listing: SliceData<Country[]>
  setSettings: (newSettings: Partial<Settings>) => void
  settings: SliceData<Settings>
}

export interface CommentData {
  comment: string
  comment_type: string
  section: string
}

export interface CPHistoryItem {
  created_at: string
  event_description: string
  id: number
  report_version: number
  reporting_officer_email: string
  reporting_officer_name: string
  updated_by_username: string
}

// Store state
export type StoreState = {
  businessPlans: BusinessPlanSlice
  cache: CacheSlice
  common: CommonSlice
  connection: null | string
  cp_current_tab: CPCurrentTabSlice
  cp_reports: CPReportsSlice
  header: HeaderSlice
  internalError: any
  projects: ProjectsSlice
  settings: SettingsSlice
  theme: ThemeSlice
  user: UserSlice
}

// Initial store state
export type InitialStoreState = {
  connection?: null | string
} & PartialDeep<StoreState>

export type Country = {
  abbr: string
  has_cp_report: boolean
  id: number
  is_a2: boolean
  iso3: string
  name: string
  name_alt: string
}

export type CPVersionInfo = {
  comment: null | string
  country: string
  country_id: number
  created_at: string
  final_version_id: number
  history: CPHistoryItem[]
  id: number
  name: string
  status: string
  version: number
  year: number
}

export type Settings = {
  blend_types: [string, string][]
  cp_reports: {
    max_year: number
    min_year: number
    nr_reports: number
  }
  project_fund_types: [string, string][]
  project_ods_odp_types: [string, string][]
  project_submission_categories: [string, string][]
  project_substance_types: [string, string][]
  send_mail: boolean
  submission_amount_statuses: [string, string][]
  year_section_mapping: { max_year: number; sections: string[] }[]
}

export type File = {
  file: Blob
  filename: string
}
