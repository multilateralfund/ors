import { RefObject } from 'react'

import { useGetPCRProjects } from './hooks/useGetPCRProjects'
import { PCRMetaProjectType } from '@ors/types/api_projects'

export type PCRUpdatedMetaproject = PCRMetaProjectType & {
  isMetaproject: boolean
  isExpanded: boolean
}

export type PCRTableProps = {
  pcrProjects: ReturnType<typeof useGetPCRProjects>
  projectId: number | null
  setProjectId: (id: number | null) => void
  filters: Record<string, any>
}

export type PCRFiltersProps = {
  form: RefObject<HTMLFormElement>
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
