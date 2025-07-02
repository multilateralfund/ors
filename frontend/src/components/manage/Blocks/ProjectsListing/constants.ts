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

export const textAreaClassname =
  'min-h-[20px] w-full max-w-[320px] md:max-w-full md:w-[415px] md:min-w-[350px] rounded-lg border bg-white p-2 pb-10 shadow-none'

export const additionalProperties: Record<string, Record<string, unknown>> = {
  ods_substance_id: {
    FieldProps: { className: defaultProps.FieldProps.className + ' w-full' },
  },
}

export const initialProjectIdentifiers = {
  is_lead_agency: true,
  country: null,
  meeting: null,
  current_agency: null,
  side_agency: null,
  cluster: null,
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
    'total_number_of_nou_personnnel_supported',
  ],
]
