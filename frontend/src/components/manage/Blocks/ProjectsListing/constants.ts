import { isOptionEqualToValue } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { SpecificFields } from './interfaces'

export const PROJECTS_PER_PAGE = 100

export const initialFilters = {
  offset: 0,
  limit: PROJECTS_PER_PAGE,
  ordering: '-date_created',
}

export const tableColumns: { [key: string]: string } = {
  submission_status: 'Submission status',
  project_status: 'Project status',
  country: 'Country',
  metacode: 'Metacode',
  code: 'Code',
  cluster: 'Cluster',
  tranche: 'Tranche number',
  agency: 'Agency',
  agencies: 'Agency',
  lead_agency: 'Lead agency',
  title: 'Title',
  type: 'Type',
  sector: 'Sector',
  subsectors: 'Sub-sector(s)',
  is_lvc: 'LVC/non-LVC',
  project_start_date: 'Project start date',
  project_end_date: 'Project end date',
  total_fund: 'Project funding',
  support_cost_psc: 'Project support cost',
  individual_consideration: 'Blanket or individual consideration',
  meeting: 'Meeting number',
  description: 'Description',
  bp_activity: 'BP activity',
  project_type: 'Project type',
  subsector_ids: 'Sub-sector(s)',
  production: 'Production',
  decision: 'Decision',
  name: 'Name',
  location: 'Location',
  application: 'Application',
  local_ownership: 'Percentage of goods exported to non-Article 5 countries',
  export_to_non_a5: 'Percentage of enterprise locally (A5) owned',
  ods_substance: 'Substance baseline technology',
  ods_blend: 'Substance baseline technology',
  phase_out_mt: 'Substance phase out (mt)',
  ods_replacement: 'Replacement technology(ies)',
  ods_replacement_phase_in: 'Replacement technology phased in (mt)',
  capital_cost_approved: 'Capital cost approved',
  operating_cost_approved: 'Operating cost approved',
  funds_disbursed: 'Funds disbursed',
  funds_approved: 'Funds approved',
  cost_effectiveness_approved: 'Cost effectiveness approved',
  remarks: 'Remarks',
}

export const defaultProps = {
  FieldProps: { className: 'mb-0 w-[12rem] BPListUpload' },
  isOptionEqualToValue: isOptionEqualToValue,
}

export const defaultPropsSimpleField = {
  label: '',
  className: 'BPListUpload mb-0 w-40 border-primary project-input',
  containerClassName: '!h-fit w-40',
}

export const textFieldClassName =
  ' min-h-[20px] w-full max-w-[320px] md:max-w-full md:w-[415px] md:min-w-[350px]'

export const textAreaClassname =
  'rounded-lg border bg-white p-2 pb-10 shadow-none' + textFieldClassName

export const additionalProperties: Record<string, Record<string, unknown>> = {
  ods_display_name: {
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-full',
    },
  },
  ods_type: {
    FieldProps: { className: defaultProps.FieldProps.className + ' w-[145px]' },
  },
}

export const initialProjectIdentifiers = {
  lead_agency_submitting_on_behalf: false,
  country: null,
  meeting: null,
  agency: null,
  lead_agency: null,
  cluster: null,
  production: false,
}

export const initialCrossCuttingFields = {
  project_type: null,
  sector: null,
  subsector_ids: [],
  is_lvc: null,
  title: '',
  description: '',
  project_start_date: null,
  project_end_date: null,
  total_fund: null,
  support_cost_psc: null,
  individual_consideration: true,
}

export const blanketOrIndConsiderationOpts = [
  { name: 'Individual', id: true },
  { name: 'Blanket', id: false },
]

export const lvcNonLvcOpts = [
  { name: 'LVC', id: true },
  { name: 'Non-LVC', id: false },
]

export const validationFieldsPairs: [
  keyof SpecificFields,
  keyof SpecificFields,
][] = [
  [
    'number_of_female_technicians_trained',
    'total_number_of_technicians_trained',
  ],
  ['number_of_female_trainers_trained', 'total_number_of_trainers_trained'],
  [
    'number_of_female_technicians_certified',
    'total_number_of_technicians_certified',
  ],
  [
    'number_of_female_customs_officers_trained',
    'total_number_of_customs_officers_trained',
  ],
  [
    'number_of_female_nou_personnel_supported',
    'total_number_of_nou_personnel_supported',
  ],

  [
    'number_of_female_technicians_trained_actual',
    'total_number_of_technicians_trained_actual',
  ],
  [
    'number_of_female_trainers_trained_actual',
    'total_number_of_trainers_trained_actual',
  ],
  [
    'number_of_female_technicians_certified_actual',
    'total_number_of_technicians_certified_actual',
  ],
  [
    'number_of_female_customs_officers_trained_actual',
    'total_number_of_customs_officers_trained_actual',
  ],
  [
    'number_of_female_nou_personnel_supported_actual',
    'total_number_of_nou_personnel_supported_actual',
  ],
]

export const disabledClassName =
  '!bg-white !text-[#9ca3af] !border border-solid !border-[#00000042] !cursor-default'

export const viewColumnsClassName =
  'flex flex-wrap gap-x-7 gap-y-5 [&>*]:basis-[calc(50%-14px)] md:[&>*]:basis-[calc(33.333%-19px)] lg:[&>*]:basis-[calc(25%-21px)]'

export const initialOverviewFields = {
  name: '',
  agencies: [],
  country: null,
  location: '',
  application: '',
  local_ownership: null,
  export_to_non_a5: null,
  remarks: '',
}

export const initialSubstanceDetailsFields = {
  ods_substance: null,
  ods_blend: null,
  phase_out_mt: null,
  ods_replacement: '',
  ods_replacement_phase_in: null,
}

export const initialFundingDetailsFields = {
  capital_cost_approved: null,
  operating_cost_approved: null,
  funds_disbursed: null,
}

export const enabledButtonClassname =
  'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'

export const dropDownClassName =
  'bg-primary px-4 py-2 text-white shadow-none hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'
export const dropdownItemClassname = 'bg-transparent font-medium normal-case'
