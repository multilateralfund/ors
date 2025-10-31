import {
  initialGlobalRequestParams,
  initialRequestParams,
  initialRowData,
} from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/initialData.ts'

export type ApiBlanketApprovalDetailsProject = {
  project_id: number
  project_title: string
  project_description: string
  agency_name: string
  country_name: string
  cluster_name: string
  project_type_name: string
  hcfc: number
  hfc: number
  project_funding: number
  project_support_cost: number
  total: number
}

export type ApiBlanketApprovalDetailsCountryData = {
  cluster_name: string
  project_type_name: string
  projects: ApiBlanketApprovalDetailsProject[]
}

export type ApiBlanketApprovalDetailsCountryEntry = {
  country_name: string
  country_data: ApiBlanketApprovalDetailsCountryData[]
  country_total: Pick<
    ApiBlanketApprovalDetailsProject,
    'hcfc' | 'hfc' | 'project_funding' | 'project_support_cost' | 'total'
  >
}

export type ApiBlanketApprovalDetails = {
  total_projects: number
  result: ApiBlanketApprovalDetailsCountryEntry[]
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
