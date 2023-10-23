import type { Language } from '@ors/types/locales'
import type { SliceData } from '@ors/types/primitives'
import type { DataType } from '@ors/types/primitives'

export interface CPReportsSlice {
  blends: SliceData
  substances: SliceData
  usages: SliceData
}

export interface HeaderSlice {
  HeaderTitle: React.FC | React.ReactNode | null
  navigationBackground: string
  setHeaderTitleComponent?: (
    component: React.FC | React.ReactNode | null,
  ) => void
  setNavigationBackground?: (value: string) => void
}

export interface I18nSlice {
  dir: 'ltr' | 'rtl'
  lang: Language
  setLang?: (lang: Language) => void
}

export interface ProjectsSlice {
  meetings: SliceData
  sectors: SliceData
  statuses: SliceData
  subsectors: SliceData
  types: SliceData
}

export interface ThemeSlice {
  mode: 'dark' | 'light' | null
  setMode?: (mode: 'dark' | 'light' | null) => void
}

export interface UserSlice {
  data: DataType
  getUser?: () => void
  login?: (username: string, password: string) => void
  logout?: () => void
  setUser?: (data: DataType) => void
}

export interface CommonSlice {
  agencies: SliceData
  countries: SliceData
  settings: SliceData
}

export type StoreState = {
  cache: { [key: string]: any }
  common: CommonSlice
  connection: null | string
  cp_reports: CPReportsSlice
  header: HeaderSlice
  i18n: I18nSlice
  projects: ProjectsSlice
  theme: ThemeSlice
  user: UserSlice
}

export type InitialStoreState = {
  cache?: { [key: string]: any }
  common?: CommonSlice
  connection?: null | string
  cp_reports?: Partial<CPReportsSlice>
  header?: Partial<HeaderSlice>
  i18n?: Partial<I18nSlice>
  projects?: ProjectsSlice
  theme?: Partial<ThemeSlice>
  user?: Partial<UserSlice>
}
