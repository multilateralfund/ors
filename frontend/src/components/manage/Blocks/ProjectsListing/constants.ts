import { isOptionEqualToValue } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { SpecificFields } from './interfaces'
import dayjs from 'dayjs'

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
  agencies: 'Agency(ies)',
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
  blanket_or_individual_consideration:
    'Blanket approval/Individual consideration',
  meeting: 'Meeting number',
  description: 'Description',
  bp_activity: 'BP activity',
  project_type: 'Project type',
  subsector_ids: 'Sub-sector(s)',
  production: 'Production',
  category: 'Category',
  decision: 'Decision meeting',
  ods_substance: 'Substance baseline technology',
  ods_blend: 'Substance baseline technology',
  phase_out_mt: 'Substance phase out (Mt)',
  ods_replacement: 'Replacement technology(ies)',
  ods_replacement_phase_in: 'Replacement technology phased in (Mt)',
  capital_cost_approved: 'Capital cost approved',
  operating_cost_approved: 'Operating cost approved',
  funds_disbursed: 'Funds disbursed',
  funds_approved: 'Funds approved',
  cost_effectiveness_approved: 'Cost effectiveness approved',
  id: 'Enterprise',
  transfer_meeting: 'Transfer meeting number',
  transfer_decision: 'Transfer decision meeting',
  transfer_excom_provision: 'Transfer Excom provision',
  fund_transferred: 'Transferred project funding (US $)',
  psc_transferred: 'Transferred project support cost (US $)',
}

export const enterpriseFieldsMapping: { [key: string]: string } = {
  code: 'Code',
  name: 'Enterprise',
  country: 'Country',
  location: 'Location',
  stage: 'Stage',
  sector: 'Sector',
  subsector: 'Sub-sector',
  application: 'Application',
  local_ownership: 'Local ownership',
  export_to_non_a5: 'Export to non-A5',
  revision: 'Revision number',
  date_of_revision: 'Date of revision',
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

export const textFieldClassName = ' min-h-[20px] w-full'

export const textAreaClassname =
  'rounded-lg border bg-white p-2 pb-10 shadow-none text-base' +
  textFieldClassName

export const additionalProperties: Record<string, Record<string, unknown>> = {
  ods_display_name: {
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-full min-w-64',
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
  category: null,
  post_excom_meeting: null,
  post_excom_decision: null,
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
  blanket_or_individual_consideration: null,
}

export const initialTranferedProjectData = {
  agency: null,
  transfer_meeting: null,
  transfer_decision: null,
  transfer_excom_provision: '',
  fund_transferred: null,
  psc_transferred: null,
}

export const lvcNonLvcOpts = [
  { name: 'LVC', id: true },
  { name: 'Non-LVC', id: false },
]

export const considerationOpts = [
  { name: 'Blanket approval', id: 'blanket', value: 'Blanket' },
  { name: 'Individual consideration', id: 'individual', value: 'Individual' },
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
  'flex flex-wrap gap-x-7 gap-y-4 [&>*]:basis-full md:[&>*]:basis-[calc(50%-14px)] lg:[&>*]:basis-[calc(33.333%-19px)] xl:[&>*]:basis-[calc(25%-21px)]'

export const exportButtonClassname =
  'cursor-pointer justify-content-center flex items-center rounded-lg border border-solid bg-primary px-3 py-1 font-[500] uppercase leading-none text-white no-underline'

export const initialOverviewFields = {
  name: '',
  country: null,
  location: '',
  stage: '',
  sector: null,
  subsector: null,
  application: '',
  local_ownership: null,
  export_to_non_a5: null,
  revision: null,
  date_of_revision: dayjs().format('YYYY-MM-DD'),
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

export const metaProjectSelectionFields = [
  { label: 'Umbrella project', key: 'umbrella_code' },
  { label: 'Lead agency', key: 'lead_agency_name' },
  { label: 'Start date (MYA)', key: 'start_date' },
  { label: 'End date (MYA)', key: 'end_date' },
  { label: 'Project funding (MYA)', key: 'project_funding' },
  { label: 'PSC (MYA)', key: 'support_cost' },
]

export const approvalOdsFields = [
  'total_phase_out_metric_tonnes',
  'total_phase_out_odp_tonnes',
  'total_phase_out_co2_tonnes',
]

export const approvalToOdsMap = {
  total_phase_out_metric_tonnes: 'phase_out_mt',
  total_phase_out_odp_tonnes: 'odp',
  total_phase_out_co2_tonnes: 'co2_mt',
}

export const textAreaViewClassname = {
  containerClassName: '!basis-full w-full',
  className: 'md:whitespace-nowrap',
  fieldClassName: 'max-w-[50%]',
}
