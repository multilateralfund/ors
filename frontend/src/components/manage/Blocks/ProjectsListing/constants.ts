import { isOptionEqualToValue } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'

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
  subsectors: 'Subsector',
  consumption_level_status: 'Consumption level status',
  project_start_date: 'Project start date',
  project_end_date: 'Project end date',
  project_duration: 'Duration of project (months)',
  total_fund: 'Project funding',
  support_cost_psc: 'Project support costs',
  blanket_or_individual_consideration:
    'Blanket approval or individual consideration',
  meeting: 'Meeting number',
  post_excom_meeting: 'Post ExCom meeting',
  description: 'Description',
  bp_activity: 'BP activity',
  project_type: 'Project type',
  subsector_ids: 'Sub-sector(s)',
  production: 'Production',
  category: 'Category',
  decision: 'Decision number',
  transfer_meeting: 'Transfer meeting number',
  transfer_decision: 'Transfer decision number',
  transfer_excom_provision: 'Transfer Executive Committee provision',
  fund_transferred: 'Transferred project funding (US $)',
  psc_transferred: 'Transferred project support costs (US $)',
  lead_agency_submitting_on_behalf:
    'Confirm you are the lead agency submitting on behalf of a cooperating agency',
  adjustment: 'Adjustment',
  interest: 'Interest (US $)',
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

const baseClassName = defaultProps.FieldProps.className
const formatClassName = (className: string) => ({
  FieldProps: {
    className: `${baseClassName} ${className}`,
  },
})
const wideFieldStyle = formatClassName('w-full min-w-56 md:min-w-64')

export const additionalProperties: Record<string, Record<string, unknown>> = {
  ods_display_name: wideFieldStyle,
  ods_replacement: wideFieldStyle,
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
  consumption_level_status: null,
  title: '',
  description: '',
  project_start_date: null,
  project_end_date: null,
  project_duration: null,
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

export const considerationOpts = [
  { name: 'Blanket approval', id: 'blanket', value: 'Blanket' },
  { name: 'Individual consideration', id: 'individual', value: 'Individual' },
]

export const disabledClassName =
  '!bg-white !text-[#9ca3af] !border border-solid !border-[#00000042] !cursor-default'

export const viewColumnsClassName =
  'flex flex-wrap gap-x-7 gap-y-4 [&>*]:basis-full md:[&>*]:basis-[calc(50%-14px)] lg:[&>*]:basis-[calc(33.333%-19px)] xl:[&>*]:basis-[calc(25%-21px)]'

export const exportButtonClassname =
  'cursor-pointer justify-content-center flex items-center rounded-lg border border-solid bg-primary px-3 py-1 font-[500] uppercase leading-none text-white no-underline'

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

export const menusDefaultProjectData = {
  projectId: null,
  projectTitle: '',
  projectSubmissionStatus: '',
  projectStatus: '',
  projectMetaprojectId: null,
  projectCode: '',
  projectEditable: false,
}

export const defaultTrancheErrors = {
  errorText: '',
  isError: false,
  tranchesData: [],
  loaded: false,
  loading: false,
}

export const projectPhaseOutFields = ['co2_mt', 'odp', 'phase_out_mt']

export const defaultMetaprojectFieldData = {
  project_funding: {
    value: null,
    label: 'MYA Total agreed funding in principle (US $)',
    order: 0,
    type: 'DecimalField',
  },
  support_cost: {
    value: null,
    label: 'MYA Total support costs in principle (US $)',
    order: 1,
    type: 'DecimalField',
  },
  project_cost: {
    value: null,
    label: 'MYA Total agreed costs in principle (US $)',
    order: 2,
    type: 'DecimalField',
  },
  start_date: {
    value: null,
    label: 'Start date (MYA)',
    order: 3,
    type: 'DateTimeField',
  },
  end_date: {
    value: null,
    label: 'End date (MYA)',
    order: 4,
    type: 'DateTimeField',
  },
  project_duration: {
    value: null,
    label: 'Project duration (months)',
    order: 5,
    type: 'IntegerField',
  },
  phase_out_co2_eq_t: {
    value: null,
    label: 'Phase-out (CO2-eq tonnes) (MYA)',
    order: 6,
    type: 'DecimalField',
  },
  phase_out_odp: {
    value: null,
    label: 'Phase-out (ODP tonnes) (MYA)',
    order: 7,
    type: 'DecimalField',
  },
  phase_out_mt: {
    value: null,
    label: 'Phase-out (metric tonnes) (MYA)',
    order: 8,
    type: 'DecimalField',
  },
  target_reduction: {
    value: null,
    label: 'Target in the last year (reduction in %)',
    order: 9,
    type: 'DecimalField',
  },
  target_co2_eq_t: {
    value: null,
    label: 'Target in the last year (CO2-eq tonnes)',
    order: 10,
    type: 'DecimalField',
  },
  target_odp: {
    value: null,
    label: 'Target in the last year (ODP tonnes)',
    order: 11,
    type: 'DecimalField',
  },
  starting_point_odp: {
    value: null,
    label:
      'Starting point for aggregate reductions in consumption or production (ODP tonnes)',
    order: 12,
    type: 'DecimalField',
  },
  starting_point_co2_eq_t: {
    value: null,
    label:
      'Starting point for aggregate reductions in consumption or production (CO2-eq tonnes)',
    order: 13,
    type: 'DecimalField',
  },
  baseline_odp: {
    value: null,
    label: 'Baseline (ODP tonnes)',
    order: 14,
    type: 'DecimalField',
  },
  baseline_co2_eq_t: {
    value: null,
    label: 'Baseline (CO2-eq tonnes)',
    order: 15,
    type: 'DecimalField',
  },
  number_of_smes_directly_funded: {
    value: null,
    label: 'Number of SMEs directly funded',
    order: 16,
    type: 'IntegerField',
  },
  number_of_non_sme_directly_funded: {
    value: null,
    label: 'Number of non-SMEs directly funded',
    order: 17,
    type: 'IntegerField',
  },
  number_of_both_sme_non_sme_not_directly_funded: {
    value: null,
    label:
      'Number of both SMEs and non-SMEs included in the project but not directly funded',
    order: 18,
    type: 'IntegerField',
  },
  number_of_production_lines_assisted: {
    value: null,
    label: 'Production sector: number of production lines assisted',
    order: 19,
    type: 'IntegerField',
  },
  cost_effectiveness_kg: {
    value: null,
    label: 'Cost effectiveness (US $/kg)',
    order: 20,
    type: 'DecimalField',
  },
  cost_effectiveness_co2: {
    value: null,
    label: 'Cost effectiveness (US $/CO2-eq tonnes) ',
    order: 21,
    type: 'DecimalField',
  },
}
