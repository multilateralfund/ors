// Response from /api/business-plan/get?

import { ApiAgency } from './api_agencies'
import { Country } from './store'

export interface ApiBP {
  agency: ApiAgency
  feedback_file_download_url: string
  feedback_filename: string
  id: number
  is_latest: boolean
  name: string
  status: string
  updated_at: string
  version: number
  year_end: number
  year_start: number
}

export interface ApiBPProjectType {
  code: string
  id: number
  name: string
  sort_order: number
}

export interface ApiBPProjectCluster {
  category: string
  code: string
  id: number
  name: string
  sort_order: number
}

export interface ApiBPChemicalType {
  id: number
  name: string
}

export interface ApiBPValue {
  id: number
  is_after: boolean
  value_mt: null | string
  value_odp: null | string
  value_usd: string
  year: number
}

export interface ApiBPActivity {
  amount_polyol: null
  bp_chemical_type: ApiBPChemicalType
  bp_chemical_type_id: number
  comment_secretariat: string
  country: Country
  country_id: number
  id: number
  initial_id: null | number
  is_multi_year: true
  is_multi_year_display: string
  is_updated: boolean
  legacy_sector_and_subsector: string
  lvc_status: string
  project_cluster: ApiBPProjectCluster
  project_cluster_id: number
  project_type: ApiBPProjectType
  project_type_id: number
  remarks: string
  required_by_model: string
  sector: null
  sector_id: null
  status: string
  status_display: string
  subsector: null
  subsector_id: null
  substances: number[]
  substances_display: string[]
  title: string
  values: ApiBPValue[]
}

export interface ApiEditBPActivity extends ApiBPActivity {
  display_internal_id: string
  row_id: number
}

export interface ApiBPHistory {}

export interface ApiBPGet {
  activities: ApiBPActivity[]
  count: number
  history: ApiBPHistory[]
  next: null | string
  previous: null | string
  results: {
    business_plan: ApiBP
  }
}
