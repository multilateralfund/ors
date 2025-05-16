import { CrossCuttingFields, ProjIdentifiers } from './interfaces'

export const PROJECTS_PER_PAGE = 100

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
  is_sme: 'SME/non-SME',
  products_manufactured: 'Products manufactured',
  group: 'Annex and group of substances',
  ods_odp: 'ODS ODP',
  ods_substance_id: 'Substance - baseline technology',
  ods_replacement: 'Replacement technology/ies',
  co2_mt: 'Phase out (CO₂-eq t)',
  odp: 'Phase out (ODP t)',
  phase_out_mt: 'Phase out (Mt)',
  ods_type: 'ODS type',
}

export const defaultProps = {
  FieldProps: { className: 'mb-0 w-[12rem] BPListUpload' },
}

export const defaultPropsSimpleField = {
  label: '',
  className: 'BPListUpload mb-0 w-40 border-primary project-input',
  containerClassName: '!h-fit w-40',
}

export const textAreaClassname =
  'min-h-[20px] w-[415px] min-w-[350px] max-w-full rounded-lg border bg-white p-2 pb-10 shadow-none'

export const additionalProperties: Record<string, Record<string, unknown>> = {
  ods_substance_id: {
    FieldProps: { className: defaultProps.FieldProps.className + ' w-full' },
  },
}

export const initialProjectIdentifiers = (): ProjIdentifiers => {
  return {
    is_lead_agency: true,
    country: null,
    meeting: null,
    current_agency: null,
    side_agency: null,
    cluster: null,
  }
}

export const initialCrossCuttingFields = (): CrossCuttingFields => {
  return {
    project_type: null,
    sector: null,
    subsector_ids: [],
    is_lvc: null,
    title: '',
    description: '',
    project_start_date: '',
    project_end_date: '',
    total_fund: '',
    support_cost_psc: '',
    psc: '',
    individual_consideration: true,
  }
}

export const blanketOrIndConsiderationOpts = [
  { name: 'Individual', value: true },
  { name: 'Blanket', value: false },
]

export const lvcNonLvcOpts = [
  { name: 'LVC', id: true },
  { name: 'Non-LVC', id: false },
]
