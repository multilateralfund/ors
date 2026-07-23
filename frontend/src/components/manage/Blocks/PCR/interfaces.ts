import { Dispatch, SetStateAction, RefObject } from 'react'

import { useGetPCRProjects } from './hooks/useGetPCRProjects'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export type PCRUpdatedMetaproject = PCRMetaProjectType & {
  isMetaproject: boolean
  isExpanded: boolean
  metaprojectId: number
  pcrId: number | null
}

export type PCRTableProps = {
  pcrProjects: ReturnType<typeof useGetPCRProjects>
  projectId: number | null
  setProjectId: (id: number | null) => void
  setPcrId: (id: number | null) => void
  filters: Record<string, any>
}

export type PCRFiltersProps = {
  form: RefObject<HTMLFormElement>
  filters: Record<string, any>
  fieldToOptionsMapping: Record<string, any>
  handleFilterChange: (newFilters: { [key: string]: any }) => void
  handleParamsChange: (params: { [key: string]: any }) => void
}

export interface PCRDefaultData {
  country: number
  decisions: number[]
  meta_project_id: number
  project_date_approved: string | null
  project_date_completion: string | null
  phase_out_ods_actual: string | null
  phase_out_ods_approved: string | null
  phase_out_co2_eq_t_actual: string | null
  phase_out_co2_eq_t_approved: string | null
  total_number_of_enterprises: string | null
  total_number_of_trainnes: string | null
}

type AdditionalCommentType = {
  user_type: number | null
  user_comment: string
}

export interface PCROverviewProps {
  mlf_funding_approved: Record<number, number>
  mlf_funding_disbursed: Record<number, number>
  mlf_funding_returned: Record<number, number>
  total_mlf_funding_approved: number
  total_mlf_funding_disbursed: number
  total_mlf_funding_returned: number
  total_number_of_enterprises: number
}

export interface PCROverviewData {
  financial_figures_status: number | null
  financial_figures_status_explanation: string
  addresses: string
  project_goal_achieved: number | null
  project_goal_achieved_explanation: string
  rating: number | null
  other_rating_explanation: string
  rating_explanation: string
  additional_comments: AdditionalCommentType[]
  completed_by: number | null
}

export interface PCRResultsAssessmentData {
  activity_title: string
  type_of_activity: string
  type_of_sector: string
  planned_output: string
  actual_activity_output: string
  additional_remarks: string
}

export interface PCRAlternativeTechnologyType {
  substance_from: number | null
  substance_to: number | null
}

export interface PCREnterpriseType {
  name: string
  address: string
}

export interface PCREquipmentType {
  name: string
  description: string
  disposal_type: number | null
  disposal_date: string
}

export interface PCRSummaryOfKeyDataType {
  project_id: number
  funds_disbursed: string
  planned_date_of_completion: string
  alternative_technologies: PCRAlternativeTechnologyType[]
  enterprises: PCREnterpriseType[]
  equipments: PCREquipmentType[]
}

type CauseOfDelay = {
  cause_of_delay_id: number | null
  description: string
}

type CauseOfDelayProjectComponent = {
  pcr_project_component_id: number | null
  delay: CauseOfDelay[]
}

export interface PCRCausesOfDelayData {
  agency_id: number
  pcr_project_component: CauseOfDelayProjectComponent[]
}

type LessonLearned = {
  lesson_learned_id: number | null
  description: string
}

type LessonLearnedProjectComponent = {
  pcr_project_component_id: number | null
  lesson: LessonLearned[]
}

export interface PCRLessonsLearnedData {
  agency_id: number
  pcr_project_component: LessonLearnedProjectComponent[]
}

type ProjectPhase = {
  project_phase_id: number | null
  gender_policy: boolean | null
  description: string
}

export interface PCRGenderMainstreamingData {
  agency_id: number
  project_phases: ProjectPhase[]
}

type Sdgs = {
  sdg_id: number | null
  description: string
}

export interface PCRSdgsData {
  agency_id: number
  sdgs: Sdgs[]
}

export interface PCRData {
  overview: PCROverviewData
  summary_of_key_data: PCRSummaryOfKeyDataType[]
  results_assessment: PCRResultsAssessmentData[]
  causes_of_delay: PCRCausesOfDelayData[]
  lessons_learned: PCRLessonsLearnedData[]
  gender_mainstreaming: PCRGenderMainstreamingData[]
  sdgs_contribution: PCRSdgsData[]
}

export type SetPCRData = (
  updater: SetStateAction<PCRData>,
  fieldName?: string,
) => void

export type PCRFormData = { PCRData: PCRData; setPCRData: SetPCRData }

export type WidgetPprops = {
  PCRData: PCRData
  setPCRData: Dispatch<SetStateAction<PCRData>>
  sectionIdentifier: keyof PCRData
  field: string
  errors: { [key: string]: string[] } | { [key: string]: string[] }[]
  indexes?: number[]
  subFields?: string[]
}

export type FieldType = 'drop_down' | 'text' | 'boolean'

export type FieldHandler = (
  value: any,
  section: keyof PCRData,
  field: string,
  setState: SetPCRData,
  indexes?: number[],
  subFields?: string[],
) => void

export type PCRHeaderType = {
  mode: string
}

export type PCRActionButtons = {
  setIsLoading: (isLoading: boolean) => void
}

export type OptionsType = {
  id: number
  name: string
}
