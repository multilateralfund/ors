import {
  initialGlobalRequestParams,
  initialRequestParams,
  initialRowData,
} from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/initialData.ts'

export type ApiSummaryOfProjects = {
  projects_count: number
  countries_count: number
  amounts_in_principle: number
  amounts_recommended: number
}
export type ApiSummaryOfProjectsFilters = {
  country: ApiFilterOption[]
  cluster: ApiFilterOption[]
  project_type: ApiFilterOption[]
  sector: ApiFilterOption[]
  agency: ApiFilterOption[]
  tranche: ApiFilterOption[]
}
export type ApiFilterOption = {
  name: string
  id: number
}
export type GlobalRequestParams = ReturnType<typeof initialGlobalRequestParams>
export type RequestParams = ReturnType<typeof initialRequestParams>
export type RowData = Omit<ReturnType<typeof initialRowData>, 'apiData'> & {
  apiData: ApiSummaryOfProjects | null
}
