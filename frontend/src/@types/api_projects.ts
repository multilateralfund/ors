import { ApiUser } from '@ors/types/api_auth_user.ts'
import { ApiBPActivity } from './api_bp_get'

export type ProjectSubSectorType = {
  id: number
  name: string
  code: string
  sort_order: number
  sector_id: number
}

export type ProjectHistoryUser = Pick<
  ApiUser,
  'first_name' | 'last_name' | 'username' | 'email'
> & { id: number }

export type ProjectHistoryItem = {
  created_at: string
  user: ProjectHistoryUser
  description: string
}

export type ProjectType = {
  ad_hoc_pcr: boolean
  agency: string
  agency_id: number
  agency_remarks: any
  application: any
  approval_meeting: number
  approval_meeting_id: number
  bp_activity: ApiBPActivity | null
  capital_cost: number
  cluster: any
  cluster_id: number
  code: string
  code_legacy: string
  comments: {
    agency_response: string
    id: number
    meeting_of_report: number
    meeting_of_report_id: number
    project_id: number
    secretariat_comment: string
  }[]
  compliance: any
  contingency_cost: any
  coop_agencies: []
  correspondance_no: any
  country: string
  country_id: number
  date_actual: string
  date_approved: any
  date_comp_revised: any
  date_completion: string
  date_of_revision: any
  date_per_agreement: any
  date_per_decision: any
  date_received: any
  decision: string
  description: any
  editable: boolean
  effectiveness_cost: any
  excom_provision: string
  export_to: number
  fund_disbursed: any
  fund_disbursed_psc: number
  funding_window: string
  funds: {
    amount: number
    date: string
    fund_type: string
    id: number
    interest: any
    meeting: number
    meeting_id: number
    project_id: number
    sort_order: number
    support_psc: number
  }[]
  funds_allocated: any
  hcfc_stage: any
  history: ProjectHistoryItem[]
  id: number
  impact: number
  impact_co2mt: number
  impact_prod_co2mt: number
  impact_production: number
  incomplete: boolean
  intersessional_approval: boolean
  issue: boolean
  issue_description: any
  latest_file: any
  lead_agency: string
  lead_agency_id: number
  loan: boolean
  local_ownership: number
  meeting: string
  meeting_transf: any
  meeting_transf_id: any
  metaproject_category: string
  metaproject_code: string
  metaproject_new_code: string
  mya_code: string
  mya_subsector: string
  national_agency: any
  ods_odp: {
    co2_mt: string
    id: number
    odp: string
    phase_out_mt: string
    ods_blend_id: any
    ods_display_name: string
    ods_replacement: any
    ods_substance_id: number
    ods_type: number
    project_id: number
    sort_order: number
  }[]
  ods_phasedout_co2mt: any
  operating_cost: number
  pcr_waived: boolean
  plan: any
  plus: boolean
  products_manufactured: any
  programme_officer: any
  project_cost: any
  project_duration: any
  project_type: any
  project_type_id: 4
  project_type_legacy: string
  rbm_measures: any[]
  remarks: string
  retroactive_finance: boolean
  reviewed_mfs: boolean
  revision_number: any
  sector: any
  sector_id: number
  sector_legacy: string
  serial_number: number
  stage: number
  status: string
  status_id: number
  submission_amounts: any[]
  submission_category: any
  submission_comments: any
  submission_number: any
  submission_status: string
  subsectors: ProjectSubSectorType[]
  subsector_legacy: string
  substance_category: string
  substance_name: string
  substance_phasedout: number
  substance_type: string
  support_cost_psc: any
  technology: any
  title: string
  total_fund_approved: any
  total_fund_transferred: any
  total_grant: any
  total_psc_cost: any
  total_psc_transferred: any
  tranche: any
  umbrella_project: boolean
  withdrawn: boolean
  decision_id: number
}

export type ProjectAssociationType = {
  id: number
  lead_agency: string
  lead_agency_id: number
  type: string
  code: string
  pcr_project_id: string
  projects: ProjectType[]
}

export type MetaProjectType = {
  id: number
  code: string
  new_code: string
  lead_agency: string | null
  lead_agency_id: number | null
  pcr_project_id: string
  type: string
}
