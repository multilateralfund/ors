import { map, range } from 'lodash'

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
  subsector: 'Sub-sector(s)',
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
  group: 'Annex group of substances',
  ods_odp: 'ODS ODP',
  ods_substance_id: 'Substance - baseline technology',
  ods_replacement: 'Replacement technology/ies',
  co2_mt: 'Phase out (CO₂-eq t)',
  odp: 'Phase out (ODP t)',
  phase_out_mt: 'Phase out (Mt)',
  ods_type: 'ODS type',
}

export const defaultProps = {
  FieldProps: { className: 'mb-0 w-40 BPListUpload' },
}

export const defaultPropsSimpleField = {
  label: '',
  className: 'BPListUpload mb-0 w-40 border-primary project-input',
  containerClassName: '!h-fit w-40',
}

export const textAreaClassname =
  'min-h-[30px] w-[400px] min-w-[350px] rounded-lg border bg-white p-2 pb-10 shadow-none'

export const blanketOrIndConsiderationOpts = [
  { name: 'Individual', value: true },
  { name: 'Blanket', value: false },
]

export const lvcNonLvcOpts = [
  { name: 'LVC', value: true },
  { name: 'Non-LVC', value: false },
]

export const isSmeOpts = [
  { name: 'SME', value: true },
  { name: 'Non-SME', value: false },
]

export const trancheOpts = map(range(1, 11), (n) => ({ id: n, name: n }))

export const odsTypeOpts = [
  { name: 'General', id: 1 },
  { name: 'Production', id: 2 },
  { name: 'Indirect', id: 3 },
]
