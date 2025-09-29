import { initialParams } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import useApi from '@ors/hooks/useApi.ts'
import { MetaProjectType } from '@ors/types/api_projects.ts'
import { formatApiUrl, getResults } from '@ors/helpers'
import { useCallback, useEffect, useState } from 'react'
import { MetaProjectDetailType } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'

export const useGetMetaProjects = (
  params: typeof initialParams,
  withCache: boolean = false,
) => {
  const { data, ...rest } = useApi<MetaProjectType[]>({
    options: {
      withStoreCache: withCache,
      params: params,
    },
    path: 'api/meta-projects-for-mya-update/',
  })
  const results = getResults(data)

  return { ...rest, ...results }
}
export const useGetMetaProjectDetails = (pk?: number) => {
  const [data, setData] = useState<MetaProjectDetailType | null>(null)

  const fetchData = (pk: number) => {
    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => setData(data))
  }

  const refresh = useCallback(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  useEffect(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  return { data, refresh }
}
