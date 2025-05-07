export const PROJECTS_PER_PAGE = 100

export const tableColumns: { [key: string]: string } = {
  submission_status: 'Submission status',
  project_status: 'Project status',
  country: 'Country',
  metacode: 'Metacode',
  code: 'Code',
  cluster: 'Cluster',
  tranche: 'Tranche',
  agency: 'Agency',
  title: 'Title',
  type: 'Type',
  sector: 'Sector',
  subsector: 'Sub-Sector',
  is_lvc: 'LVC/non-LVC',
  start_date: 'Project Start Date',
  end_date: 'Project End Date',
  total_fund: 'Total funding',
}

export const blanketOrIndConsiderationOpts = [
  { name: 'Blanket', id: 'blanket' },
  { name: 'Individual', id: 'individual' },
]

export const lvcNonLvcOpts = [
  { name: 'LVC', value: true },
  { name: 'Non-LVC', value: false },
]
