import {
  initialGlobalRequestParams,
  initialRequestParams,
  initialRowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/initialData.ts'

export type ApiBlanketApprovalDetails = {
  project_id: number
  project_title: string
  hcfc: number
  hfc: number
  project_funding: number
  project_support_cost: number
  total: number
}
export type ApiBlanketApprovalDetailsFilters = {
  country: ApiFilterOption[]
  cluster: ApiFilterOption[]
  project_type: ApiFilterOption[]
}
export type ApiFilterOption = {
  name: string
  id: number
}
export type GlobalRequestParams = ReturnType<typeof initialGlobalRequestParams>
export type RequestParams = ReturnType<typeof initialRequestParams>
export type RowData = Omit<ReturnType<typeof initialRowData>, 'apiData'> & {
  apiData: ApiBlanketApprovalDetails | null
}
