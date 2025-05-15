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
  group: number | null
  destruction_technology: string
  production_control_type: string
  tranche: number | null
  is_sme: boolean | null
  products_manufactured: string
  ods_odp: OdsOdpFields[]
  total_number_of_technicians_trained: string
  number_of_female_technicians_trained: string
  total_number_of_trainers_trained: string
  number_of_female_trainers_trained: string
  total_number_of_technicians_certified: string
  number_of_female_technicians_certified: string
  number_of_training_institutions_newly_assisted: string
  certification_system_for_technicians: boolean | null
  operation_of_recovery_and_recycling_scheme: boolean | null
  operation_of_reclamation_scheme: boolean | null
  total_number_of_customs_officers_trained: string
  number_of_female_customs_officers_trained: string
  establishment_of_imp_exp_licensing: boolean | null
  establishment_of_quota_systems: boolean | null
  ban_of_equipment: string
  ban_of_substances: string
  kwh_year_saved: string
  meps_developed_domestic_refrigeration: boolean | null
  meps_developed_commercial_refrigeration: boolean | null
  meps_developed_residential_ac: boolean | null
  meps_developed_commercial_ac: boolean | null
  capacity_building_programmes: boolean | null
  ee_demonstration_project: boolean | null
  quantity_controlled_substances_destroyed_mt: string
  quantity_controlled_substances_destroyed_co2_eq_t: string
  checklist_regulations: string
  quantity_hfc_23_by_product_generated: string
  quantity_hfc_23_byquantity_hfc_23_by_product_generation_rate_product_generated: string
  quantity_hfc_23_by_product_destroyed: string
  quantity_hfc_23_by_product_emitted: string
  total_number_of_nou_personnnel_supported: string
  number_of_female_nou_personnel_supported: string
  number_of_enterprises_assisted: string
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

export type TableFieldType = 'text' | 'drop_down' | 'decimal'
export type FieldType = TableFieldType | 'number' | 'boolean'

export type OptionsType = { id: number; name: string; name_alt?: string }
export type BooleanOptionsType = { id: boolean; name: string }

export type ProjectSpecificFields = {
  id: number
  label: string
  field_name: keyof (SpecificFields | OdsOdpFields)
  table: string
  data_type: FieldType
  section: string
  options: OptionsType[]
}

export type SpecificFieldsSectionProps = {
  fields: SpecificFields
  setFields: Dispatch<SetStateAction<SpecificFields>>
  sectionFields: ProjectSpecificFields[]
}

export type OdsOdpModalProps = {
  displayModal: boolean
  setDisplayModal: Dispatch<SetStateAction<boolean>>
  setFields: Dispatch<SetStateAction<SpecificFields>>
  odsOdpFields: ProjectSpecificFields[]
  field: keyof SpecificFields
}

export type FieldHandler = <T>(
  value: any,
  field: keyof T,
  setState: Dispatch<SetStateAction<T>>,
) => void
