import { useMemo } from 'react'

import { formatFiles } from '../utils'
import useApi from '@ors/hooks/useApi'

export function useGetProjectFiles(project_id: number) {
  const { data, loaded } = useApi({
    options: {
      withStoreCache: false,
    },
    path: `/api/projects/v2/${project_id}/project-files/include_previous_versions`,
  })

  const formattedFiles = useMemo(() => formatFiles(data, project_id), [data])

  return { files: formattedFiles, loadedFiles: loaded }
}
