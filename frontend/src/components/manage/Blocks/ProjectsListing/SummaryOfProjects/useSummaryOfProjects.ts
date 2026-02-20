import useApi from '@ors/hooks/useApi.ts'
import { ApiSummaryOfProjects } from '@ors/components/manage/Blocks/ProjectsListing/SummaryOfProjects/types.ts'
import { useEffect, useMemo } from 'react'

const useSummaryOfProjects = (apiParams: Record<string, any>) => {
  const summaryOfProjectsApi = useApi<ApiSummaryOfProjects>({
    path: 'api/summary-of-projects',
    options: {
      params: apiParams,
      withStoreCache: false,
    },
  })

  const { loaded, data, setParams, setApiSettings } = summaryOfProjectsApi

  useEffect(() => {
    setParams(apiParams)
  }, [setParams, apiParams])

  const summaryOfProjectsData = useMemo(() => {
    if (loaded && data) {
      return data
    }
    return null
  }, [loaded, data])

  return {
    summaryOfProjectsData,
    summaryOfProjectsSetParams: setParams,
    summaryOfProjectsSetApiSettings: setApiSettings,
  }
}

export default useSummaryOfProjects
