import { useCallback, useEffect, useRef, useState } from 'react'

import { MetaProjectDetailType } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/types.ts'
import { initialParams } from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/constants.ts'
import useApi from '@ors/hooks/useApi.ts'
import { formatApiUrl, getResults } from '@ors/helpers'
import { MetaProjectType } from '@ors/types/api_projects.ts'
import { ProjIdentifiers } from '../interfaces'
import { useStore } from '@ors/store'

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
  const { setLoadingMpData } = useStore((state) => state.mpData)

  const isFirstInitialRender = useRef(true)
  const isFirstChangedDataRender = useRef(true)

  const [data, setData] = useState<MetaProjectDetailType | null>(null)
  const [hasData, setHasData] = useState<boolean | null>(null)

  const { country, cluster, category } = metaProjectIdentifiers ?? {}

  const formattedCategory =
    mode === 'view' || category !== 'MYA' ? category : 'Multi-year agreement'

  const fetchData = (pk: number) => {
    setLoadingMpData(true)

    fetch(formatApiUrl(`/api/meta-projects/${pk}`), { credentials: 'include' })
      .then((resp) => resp.json())
      .then((data) => {
        setData(data)
        setHasData(true)
      })
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
      .then((data) => {
        setData(data)
        setHasData(true)
      })
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
      fetchPossibleMetaproject()
    }
  }

  useEffect(() => {
    if (isFirstInitialRender.current) {
      isFirstInitialRender.current = false

      if (pk) {
        fetchData(pk)
      } else {
        getPossibleMetaproject()
      }
    }
  }, [pk])

  useEffect(() => {
    if (isFirstChangedDataRender.current) {
      isFirstChangedDataRender.current = false

      if (!pk || hasData) {
        getPossibleMetaproject()
      }
    }
  }, [country, cluster, category])

  return { data, refresh }
}
