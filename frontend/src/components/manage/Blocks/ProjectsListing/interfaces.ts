import { Dispatch, ReactNode, SetStateAction } from 'react'
import { ProjectType } from '@ors/types/api_projects'

export interface PListingProps {
  tableToolbar: ReactNode
  projectId?: number | null
  setProjectData?: (data: {
    projectId: number | null
    projectTitle: string
  }) => void
}
export interface ProjIdentifiers {
  country: number | null
  meeting: number | null
  agency: number | null
  lead_agency: number | null
  lead_agency_submitting_on_behalf: boolean
  cluster: number | null
  production: boolean
}
export interface CrossCuttingFields {
  project_type: number | null
  sector: number | null
  subsector_ids: number[]
  is_lvc: boolean | null
  title: string
  description: string
  project_start_date: string | null
  project_end_date: string | null
  total_fund: string | null
  support_cost_psc: string | null
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
  total_number_of_technicians_trained_actual: string
  number_of_female_technicians_trained_actual: string
  total_number_of_trainers_trained: string
  number_of_female_trainers_trained: string
  total_number_of_trainers_trained_actual: string
  number_of_female_trainers_trained_actual: string
  total_number_of_technicians_certified: string
  number_of_female_technicians_certified: string
  total_number_of_technicians_certified_actual: string
  number_of_female_technicians_certified_actual: string
  number_of_training_institutions_newly_assisted: string
  certification_system_for_technicians: boolean | null
  operation_of_recovery_and_recycling_scheme: boolean | null
  operation_of_reclamation_scheme: boolean | null
  total_number_of_customs_officers_trained: string
  number_of_female_customs_officers_trained: string
  total_number_of_customs_officers_trained_actual: string
  number_of_female_customs_officers_trained_actual: string
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
  total_number_of_nou_personnel_supported: string
  number_of_female_nou_personnel_supported: string
  total_number_of_nou_personnel_supported_actual: string
  number_of_female_nou_personnel_supported_actual: string
  number_of_enterprises_assisted: string
  meeting: number | null
  meeting_approved: number | null
  decision: string | null
  decision_id: string | null
}

export type OdsOdpFields = {
  ods_display_name: string
  ods_substance_id: number | null
  odp: string
  ods_replacement: string
  co2_mt: string
  phase_out_mt: string
  ods_type: number | null
  ods_blend_id: number | null
  sort_order: number | null
}

export type FieldType =
  | 'text'
  | 'drop_down'
  | 'decimal'
  | 'number'
  | 'boolean'
  | 'date'

export type OptionsType = {
  id: number | string
  name: string
  name_alt?: string
  baseline_type?: string
}
export type BooleanOptionsType = { id: boolean; name: string }

export type ProjectSpecificFields = {
  id: number
  label: string
  read_field_name: keyof (SpecificFields | OdsOdpFields)
  write_field_name: keyof (SpecificFields | OdsOdpFields)
  table: string
  data_type: FieldType
  section: string
  options: OptionsType[]
  editable: boolean | null
  is_actual: boolean
  sort_order: number
  editable_in_versions: number[]
  visible_in_versions: number[]
}

export type SpecificFieldsSectionProps = ProjectDataProps & {
  sectionFields: ProjectSpecificFields[]
}

export type FieldHandler = <T, K>(
  value: any,
  field: keyof K,
  setState: Dispatch<SetStateAction<T>>,
  section: keyof T,
  subField?: string,
  index?: number,
) => void

export type ProjectFile = {
  id: number
  name: string
  filename: string
  date_created: string
  download_url: string
  project_id: number
  editable: boolean
}

export type ProjectAllVersionsFiles = {
  id: number
  title: string
  version: number
  files: ProjectFile[]
}

export type ProjectTypeApi = ProjIdentifiers &
  CrossCuttingFields &
  SpecificFields &
  ProjectType & {
    meeting_id: number | null
    versions: ProjectVersions[]
    version: number
    latest_project: number | null
    meta_project: Record<string, any>
    history: ProjectType['history']
  }
export interface ProjectViewProps {
  project: ProjectTypeApi
  specificFields: ProjectSpecificFields[]
}

export type DetailItemClassname = {
  containerClassName?: string
  className?: string
  fieldClassName?: string
}

export type ViewModesHandler = (
  data: ProjectTypeApi,
  field: ProjectSpecificFields,
  classNames?: DetailItemClassname | undefined,
) => ReactNode

export type ProjectFilesObject = {
  deletedFilesIds?: number[]
  newFiles?: File[]
}

export interface ProjectFiles {
  files?: ProjectFilesObject
  setFiles?: Dispatch<SetStateAction<ProjectFilesObject>>
}
export interface ProjectDocs extends ProjectFiles {
  mode: string
  loadedFiles?: boolean
  bpFiles?: ProjectFile[]
  project?: ProjectTypeApi
}

export interface ProjectVersions {
  id: number
  title: string
  version: number
  final_version_id: number
  created_by: string
  date_created: string
}

export interface ProjectData {
  projIdentifiers: ProjIdentifiers
  crossCuttingFields: CrossCuttingFields
  projectSpecificFields: SpecificFields
  approvalFields: SpecificFields
  bpLinking: {
    isLinkedToBP: boolean
    bpId: number | null
  }
}

export interface ProjectDataProps {
  projectData: ProjectData
  setProjectData: Dispatch<SetStateAction<ProjectData>>
  hasSubmitted: boolean
  errors?: { [key: string]: string[] }
}

export interface ProjectHeader {
  projectData: ProjectData
  setProjectData: Dispatch<SetStateAction<ProjectData>>
  files: ProjectFilesObject
  setProjectId: (id: number | null) => void
  setErrors: (value: { [key: string]: [] }) => void
  setHasSubmitted: (value: boolean) => void
  setFileErrors: (value: string) => void
  setOtherErrors: (value: string) => void
  specificFields: ProjectSpecificFields[]
  specificFieldsLoaded: boolean
}

export type ActionButtons = ProjectHeader & {
  isSaveDisabled: boolean
  setIsLoading: (value: boolean) => void
}

export type ProjectIdentifiersSectionProps = {
  projectData: ProjectData
  setProjectData: Dispatch<SetStateAction<ProjectData>>
  isNextBtnEnabled: boolean
  areNextSectionsDisabled: boolean
  setCurrentStep: Dispatch<SetStateAction<number>>
  setCurrentTab: Dispatch<SetStateAction<number>>
  errors: { [key: string]: string[] }
  hasSubmitted: boolean
  mode: string
}

export type TrancheErrorType = {
  errorText: string
  isError: boolean
  tranchesData: RelatedProjectsType[]
  loaded: boolean
}

export type TrancheErrors = {
  trancheErrors?: TrancheErrorType
  getTrancheErrors?: () => void
}

export type RelatedProjectsType = ProjectTypeApi & {
  errors: Record<string, string>[]
  warnings: Record<string, string>[]
}

export type RelatedProjectsSectionType = {
  title: string
  data: AssociatedProjectsType
  setData: Dispatch<SetStateAction<AssociatedProjectsType>>
  queryParams: string
  noResultsText: string
}

export type AssociatedProjectsType = {
  projects: RelatedProjectsType[] | null
  loaded: boolean
}
