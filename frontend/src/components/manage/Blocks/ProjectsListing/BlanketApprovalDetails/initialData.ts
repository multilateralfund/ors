export const initialGlobalRequestParams = () => ({
  meeting_id: '',
  submission_status: '',
  blanket_or_individual_consideration: '',
})

export const initialRequestParams = () => ({
  cluster_id: '',
  country_id: '',
  project_type_id: '',
})

export const initialRowData = () => {
  return {
    params: initialRequestParams(),
    apiData: null,
  }
}
