import { Dispatch, SetStateAction, RefObject } from 'react'

import { useGetPCRProjects } from './hooks/useGetPCRProjects'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export type PCRUpdatedMetaproject = PCRMetaProjectType & {
  isMetaproject: boolean
  isExpanded: boolean
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

export interface PCRCausesOfDelayData {
  agency_id: number
  pcr_project_component: {
    id: number | null
    delay: {
      id: number | null
      description: string
    }[]
  }[]
}

export interface PCRLessonsLearnedData {
  agency_id: number
  pcr_project_component: {
    id: number | null
    lesson: {
      id: number | null
      description: string
    }[]
  }[]
}

export interface PCRGenderMainstreamingData {
  agency_id: number
  project_phase: {
    id: number | null
    meets_criteria: boolean
    description: string
  }[]
}

export interface PCRSdgContributionData {
  agency_id: number
  sdgs: {
    id: number | null
    description: string
  }[]
}

export interface PCRData {
  summary_of_key_data: PCRSummaryOfKeyDataType[]
  results_assessment: PCRResultsAssessmentData[]
  causes_of_delay: PCRCausesOfDelayData[]
  lessons_learned: PCRLessonsLearnedData[]
  gender_mainstreaming: PCRGenderMainstreamingData[]
  sdg_contribution: PCRSdgContributionData[]
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

// can take from projects interfaces
export type FieldType = 'text'

export type FieldHandler = <T>(
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
