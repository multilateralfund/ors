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

export interface PCRResultsAssessmentData {
  type_of_activity: string
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

export interface PCRGenderMainstreamingData {
  agency_id: number
  project_phase: {
    id: number | null
    meets_criteria: boolean
    description: string
  }[]
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

export type FieldType = 'text' | 'drop_down'

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
