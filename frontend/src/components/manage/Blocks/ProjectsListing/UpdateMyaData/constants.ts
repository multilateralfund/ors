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

export const nonMonetaryFields = [
  'phase_out_odp',
  'phase_out_mt',
  'targets',
  'starting_point',
  'baseline',
]
