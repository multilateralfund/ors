import { SetStateAction } from 'react'

export interface AgencyOverview {
  agency: number | null
  mlf_funding_approved: string | null
  mlf_funding_disbursed: string | null
  mlf_funding_returned: string | null
  total_mlf_funding_approved: string | null
  total_mlf_funding_disbursed: string | null
  total_mlf_funding_returned: string | null
}

export interface RatingAdditionalComment {
  user_type: number | null
  comment: string
}

export interface PCROverview {
  country: number | null
  metacode: string
  meeting: number | null
  date_of_approval: string | null
  date_of_completion: string | null
  odp_phase_out_approved: string | null
  odp_phase_out_actual: string | null
  hfc_phased_down_approved: string | null
  hfc_phased_down_actual: string | null
  alternative_technology: number | null
  number_enterprises: string | null
  total_number_trainees: string | null
  agency_overview: AgencyOverview[]
  financial_figures_type: number | null
  financial_figures_type_explanation: string
  addresses: string
  project_goals_achieved: number | null
  project_goals_achieved_explanation: string
  rating: number | null
  other_rating_comment: string
  rating_explanation: string
  rating_additional_comment: RatingAdditionalComment[]
  completion_report_done_by: number | null
}

export interface AlternativeTechnology {
  substance_converted_from: number | null
  substance_converted_to: number | null
}

export interface Trainees {
  trainee_type: string
  number_trainees: string | null
}

export interface Enterprises {
  number_enterprises: string | null
  enterprises_address: string
  total_number_trainees: Trainees[]
}

export interface OdsEquipmentFate {
  equipment_name: string
  description: string
  disposal_type: number | null
  date_of_disposal: string | null
}

interface PCRSummaryAndDelays {
  project_code: string
  project_type: number | null
  sector: number | null
  agency: number | null
  tranche: number | null
  date_approved: string | null
  date_completion_actual: string | null
  funds_approved: string | null
  odp_phase_out_approved: string | null
  odp_phase_out_actual: string | null
  hfc_phased_down_approved: string | null
  hfc_phased_down_actual: string | null
  funds_disbursed: string | null
  date_completion_planned: string | null
  duration_planned: string | null
  duration_actual: string | null
  delay: string | null
  alternative_technology: AlternativeTechnology[]
  enterprises: Enterprises[]
  ods_equipment_fate: OdsEquipmentFate[]
}

export interface PCRResultsAssessment {
  activity_type: string
  planned_outputs: string
  actual_activity_outputs: string
  additional_remarks: string
}

export interface CauseOfDelay {
  cause_of_delay_id: number | null
  description: string
}

export interface LessonsLearned {
  lessons_learned_id: number | null
  description: string
}

export interface ProjectElementCauseOfDelay {
  project_element_id: number | null
  cause_of_delay: CauseOfDelay[]
}

export interface ProjectElementLessonsLearned {
  project_element_id: number | null
  lessons_learned: LessonsLearned[]
}

export interface PCRCausesOfDelay {
  agency: number | null
  project_element: ProjectElementCauseOfDelay[]
}

export interface PCRLessonsLearned {
  agency: number | null
  project_element: ProjectElementLessonsLearned[]
}

export interface PCRGenderMainstreaming {
  agengy: number | null
  phases: GenderMainstreamingPhase[]
}

export interface GenderMainstreamingPhase {
  phase_id: number | null
  meets_criteria: boolean
  description: string
}

export interface SGDs {
  sgd_id: number | null
  description: string
}
export interface PCRSdgContribution {
  agency: number | null
  sgds: SGDs[]
}

export type EnterpriseType = PCROverview &
  PCRSummaryAndDelays[] &
  PCRResultsAssessment[] &
  PCRCausesOfDelay[] &
  PCRLessonsLearned[] &
  PCRGenderMainstreaming[] &
  PCRSdgContribution[]

export interface PCRData {
  overview: PCROverview
  summary_and_delays: PCRSummaryAndDelays[]
  results_assessment: PCRResultsAssessment[]
  causes_of_delay: PCRCausesOfDelay[]
  lessons_learned: PCRLessonsLearned[]
  gender_mainstreaming: PCRGenderMainstreaming[]
  sdg_contribution: PCRSdgContribution[]
}

export type SetEnterpriseData = (
  updater: SetStateAction<PCRData>,
  fieldName?: string,
) => void

export type EnterpriseFormProps = {
  enterpriseData: PCRData
  setEnterpriseData: SetEnterpriseData
  errors: { [key: string]: string[] }
  enterprise?: EnterpriseType
}

export interface EnterpriseHeaderProps {
  enterpriseData: PCRData
  setErrors: (value: { [key: string]: string[] }) => void
}
