import { PropsWithChildren } from 'react'

import ProjectsDataContext from './ProjectsDataContext'
import useApi from '@ors/hooks/useApi'

import { useParams } from 'wouter'

interface ProjectsDataProviderProps extends PropsWithChildren {}

const ProjectsDataProvider = (props: ProjectsDataProviderProps) => {
  const { children } = props

  const { project_id } = useParams<Record<string, string>>()

  const { data: countries } = useApi({
    options: {
      withStoreCache: false,
      params: {
        values_exclusive_for: 'projects',
      },
    },
    path: 'api/countries/',
  })

  const { data: agencies } = useApi({
    options: {
      withStoreCache: false,
      params: {
        ordering: 'agency_type,name',
        values_exclusive_for: 'projects',
      },
    },
    path: 'api/agencies/',
  })

  const { data: clusters } = useApi({
    options: {
      params: {
        included_in_type_sector_combinations: true,
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

  const { data: substances } = useApi({
    options: {
      params: {
        filter_by_project: project_id,
      },
      withStoreCache: true,
    },
    path: 'api/substances/',
  })

  const { data: blends } = useApi({
    options: {
      params: {
        filter_by_project: project_id,
      },
      withStoreCache: true,
    },
    path: 'api/blends/',
  })

  const { data: fileTypes } = useApi({
    options: {
      params: {
        include_transferred_options: true,
      },
      withStoreCache: true,
    },
    path: 'api/file-types/',
  })

  return (
    <ProjectsDataContext.Provider
      value={{
        countries,
        agencies,
        clusters,
        project_types,
        sectors,
        subsectors,
        substances,
        blends,
        fileTypes,
      }}
    >
      {children}
    </ProjectsDataContext.Provider>
  )
}

export default ProjectsDataProvider
