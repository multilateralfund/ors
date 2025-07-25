import { createContext } from 'react'
import { Cluster } from '@ors/types/store'
import { ProjectTypeType } from '@ors/types/api_project_types'

interface ProjectsDataContextProps {
  clusters: Cluster[]
  project_types: ProjectTypeType[]
}

const ProjectsDataContext = createContext<ProjectsDataContextProps>(
  null as unknown as ProjectsDataContextProps,
)

export default ProjectsDataContext
