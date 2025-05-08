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
  subsector: 'Sub-Sector',
  is_lvc: 'LVC/non-LVC',
  project_start_date: 'Project start date',
  project_end_date: 'Project end date',
  total_fund: 'Project funding',
  support_cost_psc: 'Project support cost',
  individual_consideration: 'Blanket or individual consideration',
  meeting: 'Meeting number',
  description: 'Description',
}

export const defaultProps = {
  FieldProps: { className: 'mb-0 w-40 BPListUpload' },
}

export const blanketOrIndConsiderationOpts = [
  { name: 'Individual', value: true },
  { name: 'Blanket', value: false },
]

export const lvcNonLvcOpts = [
  { name: 'LVC', value: true },
  { name: 'Non-LVC', value: false },
]

export const trancheOpts = map(range(1, 11), (n) => ({ id: n, name: n }))
