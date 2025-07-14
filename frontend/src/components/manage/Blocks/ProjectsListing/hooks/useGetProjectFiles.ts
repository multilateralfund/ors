import { useMemo } from 'react'

import { formatFiles } from '../utils'
import useApi from '@ors/hooks/useApi'

export function useGetProjectFiles(project_id: number) {
  const { data } = useApi({
    options: {
      withStoreCache: false,
    },
    path: `/api/project/${project_id}/files/include_previous_versions/v2/`,
  })

  const formattedFiles = useMemo(() => formatFiles(data, project_id), [data])

  return formattedFiles
}
