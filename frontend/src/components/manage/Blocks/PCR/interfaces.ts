import { Dispatch, SetStateAction } from 'react'

import { ProjectTypeApi } from '@ors/components/manage/Blocks/ProjectsListing/interfaces'

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
  other_user_type: string
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
  lesson_learned_id: number | null
  description: string
}

export interface ProjectElementCauseOfDelay {
  project_element_id: number | null
  cause_of_delay: CauseOfDelay[]
}

export interface ProjectElementLessonsLearned {
  project_element_id: number | null
  lesson_learned: LessonsLearned[]
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
  agency: number | null
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

export type PCRType = PCROverview &
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

export type SetPCRData = (
  updater: SetStateAction<PCRData>,
  fieldName?: string,
) => void

export type PCRFormData = { PCRData: PCRData; setPCRData: SetPCRData }

export type PCRFormProps = PCRFormData & {
  PCR?: PCRType
  errors: { [key: string]: string[] | { [key: string]: [] }[] }
}

export interface EnterpriseHeaderProps {
  enterpriseData: PCRData
  setErrors: (value: { [key: string]: string[] }) => void
}

export type PCROverviewProps = PCRFormData & {
  errors: { [key: string]: string[] | { [key: string]: [] }[] }
}

export type PCRSectionsProps = PCRFormData &
  PCROverviewProps & {
    setCurrentTab: Dispatch<SetStateAction<number>>
  }

export type FieldHandler = <T, K>(
  value: any,
  field: keyof K,
  setState: (updater: SetStateAction<T>, fieldName?: keyof K) => void,
  section: keyof T,
  subFields?: string[],
  indexes?: number[],
) => void
