import { SetStateAction } from 'react'

export interface EnterpriseOverview {
  name: string
  country: number | null
  agency: number | null
  city: string
  location: string
  project_type: number | null
  sector: number | null
  subsector: number | null
  status: number | null
}

interface EnterpriseDetails {
  local_ownership: string | null
  export_to_non_a5: string | null
  application: string
  planned_completion_date: string | null
  actual_completion_date: string | null
  project_duration: string | null
  stage: string
  revision_number: string | null
  date_of_revision: string | null
  meeting: number | null
  date_of_approval: string | null
  date_of_report: string | null
  excom_provision: string
}

interface EnterpriseSubstanceFields {
  chemical_phased_out: string | null
  impact: string | null
}

export interface EnterpriseSubstanceDetails {
  ods_substance: number | null
  ods_blend: number | null
  consumption: string | null
  selected_alternative: string
  chemical_phased_in_mt: string | null
}

interface EnterpriseFundingDetails {
  capital_cost_approved: string | null
  operating_cost_approved: string | null
  funds_approved: string | null
  cost_effectiveness_approved: string | null
  cost_effectiveness_actual: string | null
  funds_disbursed: string | null
  funds_transferred: string | null
  capital_cost_disbursed: string | null
  operating_cost_disbursed: string | null
  co_financing_planned: string | null
  co_financing_actual: string | null
}

interface EnterpriseRemarks {
  agency_remarks: string
  secretariat_remarks: string
}

export type EnterpriseType = EnterpriseOverview &
  EnterpriseDetails &
  EnterpriseSubstanceFields &
  EnterpriseFundingDetails &
  EnterpriseRemarks & {
    id: number
    ods_odp: EnterpriseSubstanceDetails[]
  }

export interface EnterpriseData {
  overview: EnterpriseOverview
  details: EnterpriseDetails
  substance_fields: EnterpriseSubstanceFields
  substance_details: EnterpriseSubstanceDetails[]
  funding_details: EnterpriseFundingDetails
  remarks: EnterpriseRemarks
}

export type SetEnterpriseData = (
  updater: SetStateAction<EnterpriseData>,
  fieldName?: string,
) => void

export type EnterpriseFormProps = {
  enterpriseData: EnterpriseData
  setEnterpriseData: SetEnterpriseData
  errors: { [key: string]: string[] }
  enterprise?: EnterpriseType
}

export interface EnterpriseHeaderProps {
  enterpriseData: EnterpriseData
  setErrors: (value: { [key: string]: string[] }) => void
}
