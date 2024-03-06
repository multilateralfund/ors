import type { EmptyReportType } from './api_empty-form'
import type { Language } from '@ors/types/locales'
import type { DataType, SliceData } from '@ors/types/primitives'
import type { PartialDeep, UnknownArray } from 'type-fest'

import { ApiSubstance } from './api_substances'

type Report = SliceData<
  Record<string, any> | null,
  Record<string, any> | null
> & {
  emptyForm: SliceData<EmptyReportType, Record<string, any> | null>
  versions: SliceData<UnknownArray>
}

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
  fetchBundle: (id: null | number, view?: boolean, archive?: boolean) => void
  fetchEmptyForm: (id: null | number, view?: boolean) => void
  fetchReport: (id: null | number, archive?: boolean) => void
  fetchVersions: (id: null | number, archive?: boolean) => void
  report: Report
  setReport: (report: Partial<Report>) => void
  substances: SliceData<ApiSubstance[]>
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

export interface I18nSlice {
  dir: 'ltr' | 'rtl'
  lang: Language
  setLang: (lang: Language) => void
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
  logout: () => void
}

export interface CommonSlice {
  agencies: SliceData
  countries: SliceData<Country[]>
  countries_cp_report: SliceData<Country[]>
  settings: SliceData<Settings>
}

// Store state
export type StoreState = {
  businessPlans: BusinessPlanSlice
  cache: CacheSlice
  common: CommonSlice
  connection: null | string
  cp_reports: CPReportsSlice
  header: HeaderSlice
  i18n: I18nSlice
  internalError: any
  projects: ProjectsSlice
  settings: SettingsSlice
  theme: ThemeSlice
  user: UserSlice
}

// Initial store state
export type InitialStoreState = PartialDeep<StoreState> & {
  connection?: null | string
}

export type Country = {
  abbr: string
  has_cp_report: boolean
  id: number
  iso3: string
  name: string
  name_alt: string
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
  submission_amount_statuses: [string, string][]
  year_section_mapping: { max_year: number; sections: string[] }[]
}
