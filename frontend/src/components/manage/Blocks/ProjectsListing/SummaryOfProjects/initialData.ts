export const initialGlobalRequestParams = () => ({
  meeting_id: '',
  submission_status: '',
  blanket_consideration: false,
  individual_consideration: true,
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
