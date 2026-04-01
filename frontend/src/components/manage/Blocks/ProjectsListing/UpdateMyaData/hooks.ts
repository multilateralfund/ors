import { useCallback, useEffect, useState } from 'react'

import { MetaProjectDetailType } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { initialParams } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import useApi from '@ors/hooks/useApi.ts'
import { formatApiUrl, getResults } from '@ors/helpers'
import { MetaProjectType } from '@ors/types/api_projects.ts'
import { ProjIdentifiers } from '../interfaces'

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
  metaProjectIdentifiers?: Partial<ProjIdentifiers>,
) => {
  const [data, setData] = useState<MetaProjectDetailType | null>(null)

  const { country, cluster, category } = metaProjectIdentifiers ?? {}

  const formattedCategory =
    mode === 'view' || category !== 'MYA' ? category : 'Multi-year agreement'

  const fetchData = (pk: number) => {
    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => setData(data))
  }

  const fetchPossibleMetaproject = () => {
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

  const getPossibleMetaproject = () => {
    if (
      !!country &&
      !!cluster &&
      formattedCategory === 'Multi-year agreement'
    ) {
      fetchPossibleMetaproject()
    }
  }

  useEffect(() => {
    if (pk) {
      fetchData(pk)
    } else {
      getPossibleMetaproject()
    }
  }, [pk])

  useEffect(() => {
    getPossibleMetaproject()
  }, [country, cluster, category])

  return { data, refresh }
}
