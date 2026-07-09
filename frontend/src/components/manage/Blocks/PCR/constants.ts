export const initialFilters = { offset: 0, limit: 50 }

export const initialParams = {
  search: '',
  region_id: [],
  country_id: [],
  lead_agency_id: [],
  cooperating_agency_id: [],
  cluster_id: [],
  project_type_id: [],
  sector_id: [],
  subsectors: [],
  category: [],
  status_id: [],
  pcr_due: [],
  ad_hoc_pcr: [],
  pcr_submitted: [],
  pcr_submission_date_after: '',
  pcr_submission_date_before: '',
}
export const pcrFieldsMapping: { [key: string]: string } = {
  region: 'Region',
  country: 'Country',
  lead_agency: 'Lead agency',
  cooperating_agency: 'Cooperating agency',
  cluster: 'Cluster',
  project_type: 'Type',
  sector: 'Sector',
  subsectors: 'Subsector',
  category: 'IND/MYA',
  pcr_due: 'PCR due',
  ad_hoc_pcr: 'Ad-hoc PCR',
  pcr_submitted: 'PCR submitted',
  pcr_submission_date: 'PCR submission date',
  title: 'Title',
  metacode: 'Metacode',
  status: 'Status',
  code: 'Code',
  tranche: 'Tranche',
  agency: 'Agency',
  total_fund: 'Project funding',
  support_cost_psc: 'Project support costs',
}

export const categoryOpts = [
  { id: 'Individual', name: 'IND' },
  { id: 'Multi-year agreement', name: 'MYA' },
]

export const booleanFieldsOpts = [
  { id: 'Yes', name: 'Yes' },
  { id: 'No', name: 'No' },
  { id: 'N/A', name: 'N/A' },
]
