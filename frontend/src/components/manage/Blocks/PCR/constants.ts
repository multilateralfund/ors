export const pcrFieldsMapping: { [key: string]: string } = {
  title: 'Title',
  metacode: 'Metacode',
  region: 'Region',
  country: 'Country',
  lead_agency: 'Lead agency',
  cooperating_agency: 'Cooperating agency',
  cluster: 'Cluster',
  project_type: 'Type',
  sector: 'Sector',
  subsector: 'Subsector',
  category: 'Category',
  pcr_due: 'PCR due',
  ad_hoc_pcr: 'Ad-hoc PCR',
  pcr_submitted: 'PCR submitted',
  submission_date: 'PCR submission date',
}

export const initialOverviewFields = {
  country: null,
  metacode: '',
  meeting: null,
  date_of_approval: null,
  date_of_completion: null,
  odp_phase_out_approved: null,
  odp_phase_out_actual: null,
  hfc_phased_down_approved: null,
  hfc_phased_down_actual: null,
  alternative_technology: null,
  number_enterprises: null,
  total_number_trainees: null,
  agency_overview: [],
  financial_figures_type: null,
  financial_figures_type_explanation: '',
  addresses: '',
  project_goals_achieved: null,
  project_goals_achieved_explanation: '',
  rating: null,
  other_rating_comment: '',
  rating_explanation: '',
  rating_additional_comment: [],
  completion_report_done_by: null,
}
export const initialAgencyOverview = {
  agency: null,
  mlf_funding_approved: null,
  mlf_funding_disbursed: null,
  mlf_funding_returned: null,
  total_mlf_funding_approved: null,
  total_mlf_funding_disbursed: null,
  total_mlf_funding_returned: null,
}
export const initialRatingAdditionalComment = { user_type: null, comment: '' }

export const initialSummaryAndDelaysFieldsEntry = {
  project_code: '',
  project_type: null,
  sector: null,
  agency: null,
  tranche: null,
  date_approved: null,
  date_completion_actual: null,
  funds_approved: null,
  odp_phase_out_approved: null,
  odp_phase_out_actual: null,
  hfc_phased_down_approved: null,
  hfc_phased_down_actual: null,
  funds_disbursed: null,
  date_completion_planned: null,
  duration_planned: null,
  duration_actual: null,
  delay: null,
  alternative_technology: [],
  enterprises: [],
  ods_equipment_fate: [],
}
export const initialAlternativeTechnology = {
  substance_converted_from: null,
  substance_converted_to: null,
}
export const initialEnterprises = {
  number_enterprises: null,
  enterprises_address: '',
  total_number_trainees: [],
}
export const initialTrainees = {
  trainee_type: '',
  number_trainees: null,
}
export const initialOdsEquipmentFate = {
  equipment_name: '',
  description: '',
  disposal_type: null,
  date_of_disposal: null,
}

export const initialResultsAssessmentFieldsEntry = {
  activity_type: '',
  planned_outputs: '',
  actual_activity_outputs: '',
  additional_remarks: '',
}

export const initialCausesOfDelayFieldsEntry = {
  agency: null,
  project_element: [],
}
export const initialProjectElementCauseOfDelay = {
  project_element_id: null,
  cause_of_delay: [],
}
export const initialCauseOfDelay = {
  cause_of_delay_id: null,
  description: '',
}

export const initialLessonsLearnedEntry = {
  agency: null,
  project_element: [],
}
export const initialProjectElementLessonsLearned = {
  project_element_id: null,
  lessons_learned: [],
}
export const initialLessonsLearned = {
  lessons_learned_id: null,
  description: '',
}

export const initialGenderMainstreamingFieldsEntry = {
  agency: null,
  phases: [],
}
export const initialGenderMainstreamingPhase = {
  phase_id: null,
  meets_criteria: false,
  description: '',
}

export const initialSdgContributionFields = {
  agency: null,
  sgds: [],
}
export const initialSGDs = {
  sgd_id: null,
  description: '',
}
