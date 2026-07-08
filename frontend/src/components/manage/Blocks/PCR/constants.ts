export const initialFilters = { offset: 0, limit: 50 }

export const pcrFiltersMapping: { [key: string]: string } = {
  is_completed: 'Operationally completed',
  pcr_due: 'PCR due',
  ad_hoc_pcr: 'Ad-hoc PCR',
  pcr_submitted: 'PCR submitted',
}

export const pcrFieldsMapping: { [key: string]: string } = {
  region: 'Region',
  country: 'Country',
  lead_agency: 'Lead agency',
  cooperating_agency: 'Cooperating agency',
  cluster: 'Cluster',
  project_type: 'Type',
  sector: 'Sector',
  subsector: 'Subsector',
  category: 'Category',
  submission_date: 'PCR submission date',
  title: 'Title',
  metacode: 'Metacode',
  project_status: 'Status',
  code: 'Code',
  tranche: 'Tranche',
  agency: 'Agency',
  total_fund: 'Project funding',
  support_cost_psc: 'Project support costs',
}

export const categoryOpts = [
  { id: 'MYA', name: 'MYA' },
  { id: 'IND', name: 'IND' },
]
