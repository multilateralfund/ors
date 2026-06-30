import { useGetPCRProjects } from './hooks/useGetPCRProjects'
import { ProjectAssociationType } from '@ors/types/api_projects'

export type PCRTableProps = {
  pcrProjects: ReturnType<typeof useGetPCRProjects>
}

export type PCRUpdatedMetaproject = ProjectAssociationType & {
  isMetaproject: boolean
  isExpanded: boolean
}
