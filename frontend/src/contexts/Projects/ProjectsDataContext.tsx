import { createContext } from 'react'
import { Cluster } from '@ors/types/store'
import { ProjectTypeType } from '@ors/types/api_project_types'
import { ProjectSectorType } from '@ors/types/api_project_sector'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector'
import { ApiSubstance } from '@ors/types/api_substances'
import { ApiBlend } from '@ors/types/api_blends'

interface ProjectsDataContextProps {
  clusters: Cluster[]
  project_types: ProjectTypeType[]
  sectors: ProjectSectorType[]
  subsectors: ProjectSubSectorType[]
  substances: ApiSubstance[]
  blends: ApiBlend[]
}

const ProjectsDataContext = createContext<ProjectsDataContextProps>(
  null as unknown as ProjectsDataContextProps,
)

export default ProjectsDataContext
