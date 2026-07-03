export const PCR_PROJECTS_PER_PAGE = 100

export const pcrInitialFilters = {
  offset: 0,
  limit: PCR_PROJECTS_PER_PAGE,
  ordering: '-date_created',
  search: '',
  region_id: [],
  country_id: [],
  lead_agency_id: [],
  cooperating_agency_id: [],
  cluster_id: [],
  project_type_id: [],
  sector_id: [],
  subsector_id: [],
  category: [],
  pcr_due: [],
  submission_date_after: '',
  submission_date_before: '',
}

export const pcrTableColumns = {
  project_metacode: 'Project Metacode',
  country: 'Country',
  lead_agency: 'Lead Agency',
  cooperating_agency: 'Cooperating agency',
  cluster: 'Cluster',
  type: 'Type',
  sector: 'Sector',
  subsector: 'Subsector',
  category: 'IND/MYA',
  pcr_due: 'PCR due',
  title: 'Title',
  pcr_submission_date: 'PCR submission date',
}
