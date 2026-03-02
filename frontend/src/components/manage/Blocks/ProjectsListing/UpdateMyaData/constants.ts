export const MT_PER_PAGE = 50
export const initialFilters = {
  search: '',
  country_id: [],
  lead_agency_id: [],
  cluster_id: [],
}
export const initialParams = {
  search: '',
  offset: 0,
  country_id: [],
  lead_agency_id: [],
  cluster_id: [],
  limit: MT_PER_PAGE,
}

export const monetaryFields = [
  'project_funding',
  'support_cost',
  'project_cost',
  'cost_effectiveness_kg',
  'cost_effectiveness_co2',
]
