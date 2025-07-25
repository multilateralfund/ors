import { createContext } from 'react'
import { Cluster } from '@ors/types/store'

interface ProjectsDataContextProps {
  clusters: Cluster[]
}

const ProjectsDataContext = createContext<ProjectsDataContextProps>(
  null as unknown as ProjectsDataContextProps,
)

export default ProjectsDataContext
