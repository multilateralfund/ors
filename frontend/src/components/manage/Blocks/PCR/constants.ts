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
  meeting: 'Executive Committee meeting',
  date_of_approval: 'Date of approval of the project',
  date_of_completion: 'Date of completion of the project',
  financial_figures_type: 'Financial figures type',
  financial_figures_type_explanation:
    'Please provide a brief explanation if needed',
  project_goals_achieved: 'All project goals achieved',
  project_goals_achieved_explanation: 'Please provide a brief explanation',
  rating: 'Rating',
  other_rating_comment: 'Specify rating',
  rating_explanation: 'Please explain your rating',
  completion_report_done_by: 'Completion report done by',
  user_type: 'User type',
  other_user_type: 'Specify user type',
  comment: 'Additional comment',
  activity_type: 'Type of activity',
  planned_outputs: 'Planned output(s)',
  actual_activity_outputs: 'Actual activity output(s)',
  additional_remarks: 'Additional remarks, if applicable',
  agency: 'Agency',
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
export const initialRatingAdditionalComment = {
  user_type: null,
  other_user_type: '',
  comment: '',
}

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

export const financialTypeOpts = [
  { id: 1, name: 'Provisional' },
  { id: 2, name: 'Final' },
]

export const projectGoalsAchievedOpts = [
  { id: 1, name: 'Yes' },
  { id: 2, name: 'No' },
  { id: 3, name: 'N/A' },
]

export const ratingOpts = [
  { id: 1, name: 'Highly satisfactory' },
  { id: 2, name: 'Satisfactory as planned' },
  { id: 3, name: 'Satisfactory but not as planned' },
  { id: 4, name: 'Unsatisfactory' },
  { id: 5, name: 'Other, please specify' },
]

export const completionReportAuthorOpts = [
  { id: 1, name: 'Lead agency' },
  { id: 2, name: 'Cooperating agency' },
  { id: 3, name: 'National coordinating agency/NOU' },
  { id: 4, name: 'Local executing agency' },
  { id: 5, name: 'Other' },
]

export const ratingEntityUserOpts = [
  { id: 1, name: 'Cooperating agency' },
  { id: 2, name: 'Government/NOU' },
  { id: 3, name: 'Enterprises' },
  { id: 4, name: 'Consultants' },
  {
    id: 5,
    name: 'Project management officers in the Multilateral Fund Secretariat',
  },
  { id: 6, name: 'Other, please specify' },
]

export const projectElementOpts = [
  { id: 1, name: 'Project design and preparation' },
  {
    id: 2,
    name: 'Project implementation (including training and capacity building - data collection and availability)',
  },
  { id: 3, name: 'Funding and procurement' },
  { id: 4, name: 'Sustainability of Montreal Protocol achievements' },
  {
    id: 5,
    name: 'Institutional framework, policy and regulations',
  },
  { id: 6, name: 'Exogenous factors' },
  { id: 7, name: 'Technology, innovation and markets' },
]
