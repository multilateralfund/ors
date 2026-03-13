import { useCallback, useEffect, useState } from 'react'

import { MetaProjectDetailType } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { initialParams } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import useApi from '@ors/hooks/useApi.ts'
import { formatApiUrl, getResults } from '@ors/helpers'
import { MetaProjectType } from '@ors/types/api_projects.ts'

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
export const useGetMetaProjectDetails = (
  pk?: number | null,
  mode: string = 'edit',
  country?: number | null,
  cluster?: number | null,
  category?: string | null,
) => {
  const [data, setData] = useState<MetaProjectDetailType | null>(null)

  const formattedCategory =
    mode === 'view'
      ? category
      : category === 'MYA'
        ? 'Multi-year agreement'
        : 'Individual'

  const fetchData = (pk: number) => {
    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => setData(data))
  }

  const fetchPossibleData = () => {
    fetch(
      formatApiUrl(
        `/api/meta-projects/country/${country}/cluster/${cluster}/category/${formattedCategory}`,
      ),
      { credentials: 'include' },
    )
      .then((resp) => resp.json())
      .then((data) => setData(data))
  }

  const refresh = useCallback(() => {
    if (pk) {
      fetchData(pk)
    }
  }, [pk])

  useEffect(() => {
    if (pk && (mode === 'edit' || mode === 'view')) {
      fetchData(pk)
    }
    if (!pk && !!country && !!cluster && !!category) {
      fetchPossibleData()
    }
  }, [pk, country, cluster, category])

  return { data, refresh }
}
