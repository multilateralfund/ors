// Response from /api/business-plan/get?

import { ApiAgency } from './api_agencies'
import { ProjectSectorType } from './api_project_sector'
import { ProjectSubSectorType } from './api_project_subsector'
import { Country } from './store'
import { ProjectCluster } from '@ors/types/api_projects.ts'

export type ApiBaseBP = {
  id: number
  name: string
  status: string
  year_start: number
  year_end: number
  meeting_id: number
  meeting_number: null | number
  decision_id: null | number
  decision_number: null | number
  updated_at: string
  updated_by: string
}

export interface ApiBP extends ApiBaseBP {
  agency: ApiAgency
  feedback_file_download_url: string
  feedback_filename: string
  is_latest: boolean
  version: number
}

export interface ApiBPProjectType {
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
  agency: ApiAgency
  business_plan: ApiBaseBP
  bp_status: string
  amount_polyol: null
  bp_chemical_type: ApiBPChemicalType
  bp_chemical_type_id: number
  country: Country
  country_id: number
  id: number
  initial_id: null | number
  is_multi_year: true
  is_multi_year_display: string
  is_updated: boolean
  legacy_sector_and_subsector: string
  lvc_status: string
  project_cluster: ProjectCluster
  project_cluster_id: number
  project_type: ApiBPProjectType
  project_type_code: string
  project_type_id: number | null
  remarks: string
  required_by_model: string
  sector: ProjectSectorType | null
  sector_code: string
  sector_id: null
  status: string
  status_display: string
  subsector: ProjectSubSectorType | null
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
