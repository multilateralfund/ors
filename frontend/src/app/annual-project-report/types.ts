export interface Filter {
  id: number
  name: string
  code?: string
}

export interface Agency {
  id: number
  name: string
  name_display: string
}

export interface APRFile {
  id: number
  file_name: string
  file_url: string
  file_type: 'annual_progress_financial_report' | 'other_supporting_document'
}

export interface AnnualProjectReport {
  meta_code: string
  project_code: string
  legacy_code: string
  agency_name: string
  cluster_name: string
  region_name: string
  country_name: string
  type_code: string
  sector_code: string
  project_title: string
  date_approved: string | null
  date_completion_proposal: string | null
  status: string
  date_first_disbursement: string | null
  date_planned_completion: string | null
  date_actual_completion: string | null
  date_financial_completion: string | null
  consumption_phased_out_odp_proposal: number | null
  consumption_phased_out_co2_proposal: number | null
  production_phased_out_odp_proposal: number | null
  production_phased_out_co2_proposal: number | null
  consumption_phased_out_odp: number | null
  consumption_phased_out_co2: number | null
  production_phased_out_odp: number | null
  production_phased_out_co2: number | null
  approved_funding: number | null
  adjustment: number | null
  approved_funding_plus_adjustment: number | null
  per_cent_funds_disbursed: number | null
  balance: number | null
  support_cost_approved: number | null
  support_cost_adjustment: number | null
  support_cost_approved_plus_adjustment: number | null
  support_cost_balance: number | null
  funds_disbursed: number | null
  funds_committed: number | null
  estimated_disbursement_current_year: number | null
  support_cost_disbursed: number | null
  support_cost_committed: number | null
  disbursements_made_to_final_beneficiaries: number | null
  funds_advanced: number | null
  implementation_delays_status_report_decisions: string
  date_of_completion_per_agreement_or_decisions: string | null
  last_year_remarks: string
  current_year_remarks: string
  gender_policy: boolean
  id: number
  project_id: number
  created_at: string
  updated_at: string
}

export interface AnnualAgencyProjectReport {
  id: number
  progress_report: number
  progress_report_year: number
  agency: Agency
  agency_id: number
  status: 'draft' | 'submitted'
  is_unlocked: boolean
  is_endorsed: boolean
  project_reports: AnnualProjectReport[]
  files: APRFile[]
  total_projects: number
  created_at: string
  updated_at: string
  created_by: number
  created_by_username: string
  submitted_at: string | null
  submitted_by: number | null
  submitted_by_username: string | null
}

export interface AnnualProgressReport {
  id: number
  year: number
  meeting_endorsed: number | null
  meeting_endorsed_number: number | null
  date_endorsed: string | null
  remarks_endorsed: string
  endorsed: boolean
  agency_reports_count: number
  is_endorsable: boolean
  total_agencies: number
  submitted_agencies: number
  draft_agencies: number
  draft_agency_names: string[]
}

export interface AnnualProgressReportKickstart {
  can_kick_start: boolean
  latest_endorsed_year: number | null
  next_year: number | null
  unendorsed_years: number[]
  message: string
}

export interface AnnualProgressReportCurrentYear {
  current_year: number | null
  endorsed: boolean
  apr_list: {
    year: number
    endorsed: boolean
  }[]
}
