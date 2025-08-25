import { PropsWithChildren } from 'react'

import ProjectsDataContext from './ProjectsDataContext'
import useApi from '@ors/hooks/useApi'

interface ProjectsDataProviderProps extends PropsWithChildren {}

const ProjectsDataProvider = (props: ProjectsDataProviderProps) => {
  const { children } = props

  const { data: clusters } = useApi({
    options: {
      params: {
        include_obsoletes: true,
      },
      withStoreCache: true,
    },
    path: 'api/project-clusters/',
  })

  const { data: project_types } = useApi({
    options: {
      params: {
        include_obsoletes: true,
      },
      withStoreCache: true,
    },
    path: 'api/project-types/',
  })

  const { data: sectors } = useApi({
    options: {
      params: {
        include_obsoletes: true,
      },
      withStoreCache: true,
    },
    path: 'api/project-sector/',
  })

  const { data: subsectors } = useApi({
    options: {
      params: {
        include_obsoletes: true,
      },
      withStoreCache: true,
    },
    path: 'api/project-subsector/',
  })

  return (
    <ProjectsDataContext.Provider
      value={{
        clusters,
        project_types,
        sectors,
        subsectors,
      }}
    >
      {children}
    </ProjectsDataContext.Provider>
  )
}

export default ProjectsDataProvider
