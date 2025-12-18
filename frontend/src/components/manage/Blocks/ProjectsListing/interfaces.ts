import type { ProjectFieldHistoryValue } from '@ors/types/store'
import { Dispatch, ReactNode, SetStateAction } from 'react'
import { ProjectType } from '@ors/types/api_projects'

export type ListingProjectData = {
  projectId: number | null
  projectTitle: string
  projectSubmissionStatus: string
  projectStatus: string
  projectMetaprojectId: number | null
  projectCode: string
}
export interface PListingProps {
  tableToolbar: ReactNode
  projectId?: number | null
  setProjectData?: (data: ListingProjectData) => void
}
export interface ProjIdentifiers {
  country: number | null
  meeting: number | null
  agency: number | null
  lead_agency: number | null
  lead_agency_submitting_on_behalf: boolean
  cluster: number | null
  production: boolean
  category: string | null
  post_excom_meeting: number | null
  post_excom_decision: number | null
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
  blanket_or_individual_consideration: string | null
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
  decision: number | null
  decision_id: string | null
  date_completion: string | null
}

export type OdsOdpFields = {
  ods_display_name: string | null
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
  label?: string
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
  setState: (updater: SetStateAction<T>, fieldName?: keyof K) => void,
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
  type: string
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
    component: { id: number; original_project_id: number }
    versions: ProjectVersions[]
    version: number
    latest_project: number | null
    meta_project: Record<string, any>
    history: ProjectType['history']
    fund_transferred: number
    psc_transferred: number
    transfer_meeting: string
    transfer_meeting_id: number | null
    transfer_excom_provision: string
    total_phase_out_metric_tonnes: string | null
    total_phase_out_odp_tonnes: string | null
    total_phase_out_co2_tonnes: string | null
    computed_total_phase_out_metric_tonnes: string | null
    computed_total_phase_out_odp_tonnes: string | null
    computed_total_phase_out_co2_tonnes: string | null
    transferred_from: number | null
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
  fieldHistory?: ProjectFieldHistoryValue[],
  hasActualFields?: boolean,
) => ReactNode

export type ProjectFilesObject = {
  deletedFilesIds?: number[]
  newFiles?: File[]
}

export interface ProjectFiles {
  files?: ProjectFilesObject
  setFiles?: Dispatch<SetStateAction<ProjectFilesObject>>
}
export interface ProjectDocs extends ProjectFiles, FileMetaDataProps {
  mode: string
  loadedFiles?: boolean
  bpFiles?: ProjectFile[]
  project?: ProjectTypeApi
  errors?: Array<{ id: number; message: string } | null>
  allFileErrors?: { message: string }[]
}

export interface ProjectVersions {
  id: number
  title: string
  version: number
  final_version_id: number
  submission_status: string
  created_by: string
  date_created: string
  meeting: number | null
  post_excom_meeting: number | null
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

export interface ProjectTransferData {
  agency: number | null
  transfer_meeting: number | null
  transfer_decision: number | null
  transfer_excom_provision: string
  fund_transferred: string | null
  psc_transferred: string | null
}

export type SetProjectData = (
  updater: SetStateAction<ProjectData>,
  fieldName?: string,
) => void

export interface ProjectDataProps {
  projectData: ProjectData
  setProjectData: SetProjectData
  errors?: { [key: string]: string[] }
}

export interface ProjectHeader {
  projectData: ProjectData
  setProjectData: Dispatch<SetStateAction<ProjectData>>
  files: ProjectFilesObject
  setProjectId: (id: number | null) => void
  setErrors: (value: { [key: string]: [] }) => void
  setFileErrors: (value: string) => void
  setOtherErrors: (value: string) => void
  specificFields: ProjectSpecificFields[]
  specificFieldsLoaded: boolean
  filesMetaData?: FileMetaDataType[]
}

export type ActionButtons = ProjectHeader & {
  isSaveDisabled: boolean
  setIsLoading: (value: boolean) => void
}

export type ProjectTabSetters = {
  setCurrentStep?: Dispatch<SetStateAction<number>>
  setCurrentTab?: Dispatch<SetStateAction<number>>
}

export type ProjectIdentifiersSectionProps = ProjectTabSetters & {
  projectData: ProjectData
  setProjectData: SetProjectData
  isNextBtnEnabled: boolean
  areNextSectionsDisabled: boolean
  errors: { [key: string]: string[] }
  mode: string
  project?: ProjectTypeApi
  postExComUpdate?: boolean
  isV3ProjectEditable: boolean
  specificFieldsLoaded: boolean
}

export type TrancheErrorType = {
  errorText: string
  isError: boolean
  tranchesData: RelatedProjectsType[]
  loaded: boolean
  loading: boolean
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
  downloadButton?: ReactNode
}

export type AssociatedProjectsType = {
  projects: RelatedProjectsType[] | null
  loaded: boolean
}

export type PEnterpriseType = EnterpriseDetails &
  EnterpriseSubstanceFields &
  EnterpriseFundingDetails &
  EnterpriseRemarks & {
    id: number | null
    status: string
    enterprise: EnterpriseType
    ods_odp: EnterpriseSubstanceDetails[]
  }

export interface PEnterpriseData {
  overview: EnterpriseOverview
  details: EnterpriseDetails
  substance_details: EnterpriseSubstanceDetails[]
  substance_fields: EnterpriseSubstanceFields
  funding_details: EnterpriseFundingDetails
  remarks: EnterpriseRemarks
}

export type PEnterpriseDataType = {
  enterpriseData: PEnterpriseData
  setEnterpriseData: Dispatch<SetStateAction<PEnterpriseData>>
  enterprise?: PEnterpriseType
}

export type EnterpriseDataType = {
  enterpriseData: EnterpriseOverview
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>
  enterprise?: EnterpriseType
}

export type EnterprisesCommonProps = {
  hasSubmitted: boolean
  errors: { [key: string]: string[] }
}

export type PEnterpriseDataProps = PEnterpriseDataType & EnterprisesCommonProps

export type EnterpriseDataProps = EnterpriseDataType & EnterprisesCommonProps

export interface EnterpriseOverview {
  name: string
  country: number | null
  location: string
  stage: string
  sector: number | null
  subsector: number | null
  application: string
  local_ownership: string | null
  export_to_non_a5: string | null
  revision: string | null
  date_of_revision: string | null
  linkStatus?: string
}

export interface EnterpriseDetails {
  agency: number | null
  project_type: number | null
  planned_completion_date: string | null
  actual_completion_date: string | null
  project_duration: string | null
  date_of_approval: string | null
  meeting: number | null
  excom_provision: string
  date_of_report: string | null
}

export type EnterpriseType = EnterpriseOverview & {
  id: number
  status: string
  code: string
}

export interface EnterpriseSubstanceDetails {
  ods_substance: number | null
  ods_blend: number | null
  consumption: string | null
  selected_alternative: string
  chemical_phased_in: string | null
}

export interface EnterpriseSubstanceFields {
  chemical_phased_out: string | null
  impact: string | null
}

export interface EnterpriseFundingDetails {
  capital_cost_approved: string | null
  operating_cost_approved: string | null
  funds_disbursed: string | null
  funds_approved: string | null
  cost_effectiveness_approved: string | null
  capital_cost_disbursed: string | null
  operating_cost_disbursed: string | null
  cost_effectiveness_actual: string | null
  co_financing_planned: string | null
  co_financing_actual: string | null
  funds_transferred: string | null
}

export interface EnterpriseRemarks {
  agency_remarks: string
  secretariat_remarks: string
}
export interface EnterpriseHeaderProps {
  setEnterpriseId: (id: number | null) => void
  setHasSubmitted: (value: boolean) => void
  setErrors: (value: { [key: string]: string[] }) => void
  setOtherErrors: (value: string) => void
}

export type EnterpriseActionButtons = EnterpriseHeaderProps & {
  setIsLoading: (value: boolean) => void
}

export interface BpDataProps {
  hasBpData: boolean
  bpDataLoading: boolean
}

export interface FileMetaDataType {
  id: number | null
  name: string
  type: string | null
}

export interface FileMetaDataProps {
  filesMetaData?: FileMetaDataType[]
  setFilesMetaData?: Dispatch<SetStateAction<FileMetaDataType[]>>
}
