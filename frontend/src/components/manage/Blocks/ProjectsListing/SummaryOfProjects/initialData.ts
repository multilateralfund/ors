export const initialGlobalRequestParams = () => ({
  meeting_id: '',
  submission_status: '',
  blanket_or_individual_consideration: null,
})

export const initialRequestParams = () => ({
  cluster_id: '',
  country_id: '',
  project_type_id: '',
  sector_id: '',
  agency_id: '',
  tranche: '',
})

export const initialRowData = () => {
  return {
    params: initialRequestParams(),
    apiData: null,
    text: '',
  }
}
