import { Dispatch, SetStateAction } from 'react'

export interface ProjIdentifiers {
  country: number | null
  meeting: number | null
  current_agency: number | null
  side_agency: number | null
  is_lead_agency: boolean
  cluster: number | null
}
export interface CrossCuttingFields {
  project_type: number | null
  sector: number | null
  subsector_ids: number[]
  is_lvc: boolean | null
  title: string
  description: string
  project_start_date: string
  project_end_date: string
  total_fund: string
  support_cost_psc: string
  psc: string
  individual_consideration: boolean
}
export interface SpecificFields {
  tranche: number | null
  is_sme: boolean | null
  products_manufactured: string
  group: number | null
  ods_odp: OdsOdpFields[]
}

export type OdsOdpFields = {
  ods_substance_id: number | null
  odp: string
  ods_replacement: string
  co2_mt: string
  phase_out_mt: string
  ods_type: number | null
  ods_blend_id: number | null
  sort_order: number | null
}

export type SpecificFieldsSectionProps = {
  projectSpecificFields: SpecificFields
  setProjectSpecificFields: React.Dispatch<React.SetStateAction<SpecificFields>>
  fields: ProjectSpecificFields[]
}

export type OdsOdpModalProps = {
  displayODPModal: boolean
  setDisplayODPModal: Dispatch<SetStateAction<boolean>>
  setProjectSpecificFields: React.Dispatch<React.SetStateAction<SpecificFields>>
  odsOdpFields: ProjectSpecificFields[]
  field: string
}

export type TableFieldType = 'text' | 'drop_down' | 'decimal'
export type FieldType = TableFieldType | 'number' | 'boolean'

export type ProjectSpecificFields = {
  id: number
  label: string
  field_name: keyof SpecificFields
  table: string
  data_type: FieldType
  section: string
  options: OptionsType[]
}

export type OptionsType = { id: number; name: string }
export type BooleanOptionsType = { id: boolean; name: string }
