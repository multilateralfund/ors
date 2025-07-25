import { createContext } from 'react'
import { Cluster } from '@ors/types/store'
import { ProjectTypeType } from '@ors/types/api_project_types'
import { ProjectSectorType } from '@ors/types/api_project_sector'

interface ProjectsDataContextProps {
  clusters: Cluster[]
  project_types: ProjectTypeType[]
  sectors: ProjectSectorType[]
}

const ProjectsDataContext = createContext<ProjectsDataContextProps>(
  null as unknown as ProjectsDataContextProps,
)

export default ProjectsDataContext
