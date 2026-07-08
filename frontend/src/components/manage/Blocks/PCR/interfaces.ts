import { useGetPCRProjects } from './hooks/useGetPCRProjects'
import { ProjectAssociationType } from '@ors/types/api_projects'

export type PCRTableProps = {
  pcrProjects: ReturnType<typeof useGetPCRProjects>
  projectId: number | null
  setProjectId: (id: number | null) => void
  filters: Record<string, any>
}

export type PCRUpdatedMetaproject = ProjectAssociationType & {
  isMetaproject: boolean
  isExpanded: boolean
}

export type PCRFiltersProps = {
  form: any
  filters: Record<string, any>
  fieldToOptionsMapping: Record<string, any>
  handleFilterChange: (newFilters: { [key: string]: any }) => void
  handleParamsChange: (params: { [key: string]: any }) => void
}

export type PCRStatus = {
  id: number
  code: string
  name: string
}
