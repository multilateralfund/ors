import { useCallback, useEffect, useMemo, useState } from 'react'

import { MetaProjectDetailType } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { initialParams } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import useApi from '@ors/hooks/useApi.ts'
import { formatApiUrl, getResults } from '@ors/helpers'
import { MetaProjectType } from '@ors/types/api_projects.ts'
import { ProjIdentifiers } from '../interfaces'
import { useStore } from '@ors/store'

import { debounce } from 'lodash'

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
  submissionStatus?: string | null,
) => {
  const { setLoadingMpData } = useStore((state) => state.mpData)

  const [data, setData] = useState<MetaProjectDetailType | null>(null)

  const { country, cluster, category } = metaProjectIdentifiers ?? {}
  const formattedCategory =
    mode === 'view' || category !== 'MYA' ? category : 'Multi-year agreement'

  const isEditOrView = ['edit', 'view'].includes(mode)

  const fetchData = (pk: number) => {
    setLoadingMpData(true)

    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => setData(data))
      .finally(() => setLoadingMpData(false))
  }

  const fetchPossibleMetaproject = () => {
    setLoadingMpData(true)

    fetch(
      formatApiUrl(
        `/api/meta-projects/country/${country}/cluster/${cluster}/category/${formattedCategory}`,
      ),
      { credentials: 'include' },
    )
      .then((resp) => resp.json())
      .then((data) => setData(data))
      .finally(() => setLoadingMpData(false))
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
      debouncedFetchPossibleMetaproject()
    }
  }

  const debouncedFetchData = useMemo(
    () => debounce((pk) => fetchData(pk), 0),
    [fetchData],
  )

  const debouncedFetchPossibleMetaproject = useMemo(
    () => debounce(() => fetchPossibleMetaproject(), 0),
    [fetchPossibleMetaproject],
  )

  useEffect(() => {
    if (pk) {
      debouncedFetchData(pk)
    }
  }, [pk])

  useEffect(() => {
    if (!pk) {
      if (!isEditOrView || submissionStatus !== 'Approved') {
        getPossibleMetaproject()
      } else {
        setData(null)
        setLoadingMpData(false)
      }
    }
  }, [pk, country, cluster, category])

  return { data, refresh }
}
