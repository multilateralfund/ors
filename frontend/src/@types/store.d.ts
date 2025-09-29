import { ProjectSpecificFields } from '@ors/components/manage/Blocks/ProjectsListing/interfaces'
import type { CPReport, CPReportDiff } from './api_country-programme_records'
import type { EmptyFormType } from './api_empty-form'
import type { ApiSubstance } from './api_substances'
import { ApiUser } from '@ors/types/api_auth_user'
import { ApiBlend } from '@ors/types/api_blends'
import type { DataType, SliceData } from '@ors/types/primitives'
import type { PartialDeep } from 'type-fest'

import { StoreApi } from 'zustand'

import { ApiAgency } from './api_agencies'
import { ApiBP } from './api_bp_get'
import { ReportVariant } from './variants'
import { ApiBPYearRanges } from './api_bp_get_years'
import { ProjectSectorType } from '@ors/types/api_project_sector.ts'
import { ProjectStatusType } from '@ors/types/api_project_statuses.ts'
import { ProjectSubmissionStatusType } from '@ors/types/api_project_submission_statuses.ts'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import { ProjectTypeType } from '@ors/types/api_project_types.ts'
import { ProjectSubstancesGroupsType } from '@ors/types/api_project_substances_groups'
import { MeetingType } from '@ors/types/api_meetings.ts'

type StoreProviderProps = {
  children: React.ReactNode
  initialState: InitialStoreState
}

export type CreateSliceProps = {
  initialState: InitialStoreState
  get: StoreApi<StoreState>['getState']
  set: StoreApi<StoreState>['setState']
}

export type StatusFilterTypes = 'all' | 'draft' | 'final'

export type FiltersType = {
  country: Country[]
  range: [number?, number?]
  status: StatusFilterTypes
}

export type BPFiltersType = {
  range: string
}

export type Report = {
  country?: Country
  emptyForm: SliceData<EmptyFormType, Record<string, any> | null>
  files: SliceData<File[]>
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
  fetchBundle: (
    country_id: number,
    year: number,
    view?: boolean,
  ) => Promise<void>
  fetchDiffBundle: (
    country_id: number,
    year: number,
    version: number,
    report_id?: number,
  ) => void
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
  diffActiveTab: number
  setActiveTab: (nr: number) => void
  setDiffActiveTab: (nr: number) => void
}

export interface BPDiffVersionsSlice {
  currentVersion: number
  previousVersion: number
  setCurrentVersion: (version: number) => void
  setPreviousVersion: (version: number) => void
}

type UpdatedBusinessPlan = {
  activities: Array<ApiBP>
  agency_id: number
  id: number
  name: string
  status: string
  year_end: number
  year_start: number
  updated_at: string
}

export interface BPSlice {
  businessPlan: UpdatedBusinessPlan
  setBusinessPlan: (business_plan: UpdatedBusinessPlan) => void
}

export interface BPTypeSlice {
  bpType: string
  setBPType: (type: string) => void
}

export interface BPYearRangesSlice {
  yearRanges: {
    loading: boolean
    loaded: boolean
    data: ApiBPYearRanges
    error: any
  }
  fetchYearRanges: () => void
}

export interface BPCurrentTabSlice {
  activeTab: number
  setActiveTab: (nr: number) => void
}

type ErrorTemplate = { [key: string]: Array<string> }

export interface BPErrorsSlice {
  rowErrors: ErrorTemplate[]
  setRowErrors: (errors: ErrorTemplate[]) => void
}

export interface ProjectsSlice {
  clusters: SliceData<Cluster[]>
  meetings: SliceData<MeetingType[]>
  sectors: SliceData<ProjectSectorType[]>
  statuses: SliceData<ProjectStatusType[]>
  submission_statuses: SliceData<ProjectSubmissionStatusType[]>
  subsectors: SliceData<ProjectSubSectorType[]>
  setProjectSettings: (newProjectSettings: Partial<Settings>) => void
  project_settings: SliceData<Settings>
  types: SliceData<ProjectTypeType[]>
  substances_groups: SliceData<ProjectSubstancesGroupsType[]>
}

export interface ProjectsFieldsSlice {
  projectFields: {
    loading: boolean
    loaded: boolean
    data: ProjectSpecificFields[]
    error: any
  }
  viewableFields: string[]
  editableFields: string[]
  setViewableFields: (version: number, submissionStatus?: string) => void
  setEditableFields: (
    version: number,
    submissionStatus?: string,
    canEditAll?: boolean,
    isPostExcom?: boolean,
    mode?: string,
  ) => void
  fetchProjectFields: () => Promise<void>
}

export type ProjectWarningsType = {
  id: number | null
  warnings: string[]
}

export interface ProjectWarningsTypeSlice {
  warnings: ProjectWarningsType
  setWarnings: (warnings: ProjectWarningsType) => void
}

export interface ProjectFieldHistoryValue {
  version: number
  value: any
  post_excom_meeting: number | null
}

export type ProjectFieldHistoryEntry = Record<
  string,
  ProjectFieldHistoryValue[]
>

export interface ProjectFieldHistorySlice {
  fieldHistory: {
    loading: boolean
    loaded: boolean
    data: ProjectFieldHistoryEntry
    error: any
  }
  fetchFieldHistory: (projectId: number) => Promise<void>
}

export interface BusinessPlanSlice {
  sectors: SliceData
  subsectors: SliceData
  types: SliceData
  decisions: SliceData
}

export interface ThemeSlice {
  mode: 'dark' | 'light' | null
  setMode: (mode: 'dark' | 'light' | null) => void
}

export interface UserSlice
  extends SliceData<ApiUser, Record<string, any> | null | undefined> {
  getUser: () => Promise<void>
  login: (username: string, password: string) => void
  logout: () => Promise<void>
}

export interface CommonSlice {
  agencies: SliceData<ApiAgency[]>
  agencies_with_all: SliceData<ApiAgency[]>
  countries: SliceData<Country[]>
  countries_for_create: SliceData<Country[]>
  countries_for_listing: SliceData<Country[]>
  setSettings: (newSettings: Partial<Settings>) => void
  settings: SliceData<Settings>
  user_permissions: SliceData<string[]>
}

export interface FiltersSlice {
  filters: FiltersType
  setFilters: (newFilters: Partial<FiltersType>) => void
}

export interface BPFiltersSlice {
  bpFilters: BPFiltersType
  setBPFilters: (newFilters: Partial<BPFiltersType>) => void
}

export interface CommentData {
  comment: string
  comment_type: string
  section: string
}

export interface HistoryListItem {
  created_at: string
  event_description: string
  id: number
  report_version: number
  reporting_officer_email: string
  reporting_officer_name: string
  updated_by_email: string
  updated_by_first_name: string
  updated_by_last_name: string
  updated_by_username: string
}

// Store state
export type StoreState = {
  yearRanges: BPYearRangesSlice
  bp_diff_versions: BPDiffVersionsSlice
  bpFilters: BPFiltersSlice
  bpType: BPTypeSlice
  businessPlan: BPSlice
  businessPlans: BusinessPlanSlice
  bp_current_tab: BPCurrentTabSlice
  bpErrors: BPErrorsSlice
  cache: CacheSlice
  common: CommonSlice
  connection: null | string
  cp_current_tab: CPCurrentTabSlice
  cp_reports: CPReportsSlice
  filters: FiltersSlice
  internalError: any
  projects: ProjectsSlice
  projectFields: ProjectsFieldsSlice
  projectWarnings: ProjectWarningsTypeSlice
  projectFieldHistory: ProjectFieldHistorySlice
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
  is_lvc: boolean
}

export type Cluster = {
  id: number
  name: string
  code: string
  category: string
  production: boolean
  sort_order: number
  obsolete: boolean
}

export type CPVersionInfo = {
  comment: null | string
  country: string
  country_id: number
  created_at: string
  final_version_id: number
  history: HistoryListItem[]
  id: number
  name: string
  status: string
  version: number
  year: number
}

export type Settings = {
  blend_types: [string, string][]
  business_plan_activity_statuses: [string, string][]
  business_plan_statuses: [string, string][]
  cp_notification_emails: string
  project_submission_notifications_enabled: boolean
  project_submission_notifications_emails: string
  project_recommendation_notifications_enabled: boolean
  project_recommendation_notifications_emails: string
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
