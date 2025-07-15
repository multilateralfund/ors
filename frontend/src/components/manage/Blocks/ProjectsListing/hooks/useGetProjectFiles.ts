import { useMemo } from 'react'

import { ProjectTypeApi } from '../interfaces'
import { formatFiles } from '../utils'
import useApi from '@ors/hooks/useApi'

export function useGetProjectFiles(project: ProjectTypeApi) {
  const { id } = project

  const { data } = useApi({
    options: {
      withStoreCache: false,
    },
    path: `/api/project/${id}/files/include_previous_versions/v2/`,
  })

  const formattedFiles = useMemo(() => formatFiles(data, project), [data])

  return formattedFiles
}
