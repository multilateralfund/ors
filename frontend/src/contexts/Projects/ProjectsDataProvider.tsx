import { PropsWithChildren } from 'react'

import ProjectsDataContext from './ProjectsDataContext'
import useApi from '@ors/hooks/useApi'

interface PermissionsProviderProps extends PropsWithChildren {}

const ProjectsDataProvider = (props: PermissionsProviderProps) => {
  const { children } = props

  const { data: clusters } = useApi({
    options: {
      params: {
        include_obsoletes: true,
      },
      withStoreCache: false,
    },
    path: 'api/project-clusters/',
  })

  const { data: project_types } = useApi({
    options: {
      params: {
        include_obsoletes: true,
      },
      withStoreCache: false,
    },
    path: 'api/project-types/',
  })

  return (
    <ProjectsDataContext.Provider
      value={{
        clusters,
        project_types,
      }}
    >
      {children}
    </ProjectsDataContext.Provider>
  )
}

export default ProjectsDataProvider
