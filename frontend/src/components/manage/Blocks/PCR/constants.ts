export const initialFilters = { offset: 0, limit: 50 }

export const initialParams = {
  search: '',
  region_id: [],
  country_id: [],
  lead_agency_id: [],
  cooperating_agency_id: [],
  cluster_id: [],
  project_type_id: [],
  sector_id: [],
  subsectors: [],
  category: [],
  status_id: [],
  pcr_due: [],
  ad_hoc_pcr: [],
  pcr_submitted: [],
  pcr_submission_date_after: '',
  pcr_submission_date_before: '',
}
export const pcrFieldsMapping: { [key: string]: string } = {
  region: 'Region',
  country: 'Country',
  lead_agency: 'Lead agency',
  cooperating_agency: 'Cooperating agency',
  cluster: 'Cluster',
  project_type: 'Type',
  sector: 'Sector',
  subsectors: 'Subsector',
  category: 'IND/MYA',
  pcr_due: 'PCR due',
  ad_hoc_pcr: 'Ad-hoc PCR',
  pcr_submitted: 'PCR submitted',
  pcr_submission_date: 'PCR submission date',
  title: 'Title',
  metacode: 'Metacode',
  status: 'Status',
  code: 'Code',
  tranche: 'Tranche',
  agency: 'Agency',
  total_fund: 'Project funding',
  support_cost_psc: 'Project support costs',
  decisions: 'Relevant decision(s)',
  project_date_approved: 'Date of approval of the project',
  project_date_completion: 'Date of completion of the project',
  phase_out_ods_actual: 'ODP phase-out (Actual)',
  phase_out_ods_approved: 'ODP phase-out (Approved)',
  phase_out_co2_eq_t_actual: 'HFCs phased down (CO2 eq-tonnes) (Actual)',
  phase_out_co2_eq_t_approved: 'HFCs phased down (CO2 eq-tonnes) (Approved)',
  total_number_of_enterprises: 'Number of enterprises',
  total_number_of_trainnes: 'Total number of trainees',
  mlf_funding_approved: 'MLF funding approved',
  mlf_funding_disbursed: 'MLF funding disbursed',
  mlf_funding_returned: 'MLF funding returned',
  total_mlf_funding_approved: 'Total MLF funding approved',
  total_mlf_funding_disbursed: 'Total MLF funding disbursed',
  total_mlf_funding_returned: 'Total MLF funding returned',
  financial_figures_status: 'Financial figures status',
  financial_figures_status_explanation: 'Explanations if needed',
  addresses: 'Address(es) of enterprise(s) and project site(s), if applicable',
  project_goal_achieved: 'All project goals achieved',
  project_goal_achieved_explanation:
    'If no, please provide a brief explanation',
  rating: 'Rating',
  rating_explanation_other: 'Specify rating',
  rating_explanation: 'Please explain your rating',
  entity: 'Entity user inputting the comment on behalf',
  comment: 'Add comment',
  completed_by: 'Completion report done by',
  activity_title: 'Activity title',
  type_of_activity: 'Type of activity',
  type_of_sector: 'Type of sector',
  planned_output: 'Planned output(s)',
  actual_activity_output: 'Actual activity output(s)',
  additional_remarks: 'Additional remarks, if applicable',
  project_component_option_id: 'Project component',
  delay_id: 'Cause of delay',
  description: 'Description',
  lesson_id: 'Lesson learned',
  project_preparation: 'Project cycle phase',
  qualitative_description: 'Qualitative description',
  prefilled: 'Gender policy for all projects approved from 85th meeting',
  goal_id: 'SDG',
}

export const pcrFieldsErrorsMapping: { [key: string]: string } = {
  financial_figures_status_explanation: 'Financial figures status explanation',
  addresses: 'Address(es) of enterprise(s) and project site(s)',
  project_goal_achieved_explanation: 'All project goals achieved explanation',
  rating_explanation: 'Rating explanation',
  additional_comments: 'Additional comment',
  comment: 'Comment',
  activities: 'Activity',
  project_components: 'Project component',
  delay_causes: 'Cause of delay',
  learned_lessons: 'Lesson learned',
  gender_mainstreamings: 'Gender mainstreaming',
  sustainable_development_goals: 'SDG',
}

export const categoryOpts = [
  { id: 'Individual', name: 'IND' },
  { id: 'Multi-year agreement', name: 'MYA' },
]

export const booleanFieldsOpts = [
  { id: 'Yes', name: 'Yes' },
  { id: 'No', name: 'No' },
  { id: 'N/A', name: 'N/A' },
]

export const financialFiguresTypeOptions = [
  { id: 'Provisional', name: 'Provisional' },
  { id: 'Final', name: 'Final' },
]

export const projectPhaseOptions = [
  { id: 'Project preparation', name: 'Project preparation' },
  { id: 'Planning/Formulation', name: 'Planning/Formulation' },
  { id: 'Implementation', name: 'Implementation' },
  { id: 'Monitoring and Reporting', name: 'Monitoring and Reporting' },
]

export const initialOverviewData = {
  financial_figures_status: null,
  financial_figures_status_explanation: '',
  addresses: '',
  project_goal_achieved: null,
  project_goal_achieved_explanation: '',
  rating: null,
  rating_explanation_other: '',
  rating_explanation: '',
  additional_comments: [],
  completed_by: null,
}

export const overviewFieldsToValidate = [
  'financial_figures_status_explanation',
  'addresses',
  'project_goal_achieved_explanation',
  'rating_explanation',
]
export const requiredMessage = 'This field is required.'
export const validWordCountMessage =
  'This field must be between 150 and 250 words.'

export const pcField = 'project_components'
export const cdField = 'delay_causes'
export const llField = 'learned_lessons'
export const ppField = 'gender_mainstreamings'
export const sdgsContributionField = 'sustainable_development_goals'
export const sdgsField = 'goals'
