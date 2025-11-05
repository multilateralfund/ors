import useApi from '@ors/hooks/useApi.ts'
import { ApiBlanketApprovalDetails } from '@ors/components/manage/Blocks/ProjectsListing/BlanketApprovalDetails/types.ts'
import { useEffect, useMemo } from 'react'

const useBlanketApprovalDetails = (apiParams: Record<string, any>) => {
  const api = useApi<ApiBlanketApprovalDetails>({
    options: { params: apiParams },
    path: 'api/blanket-approval-details',
  })

  const { setParams } = api

  useEffect(() => {
    setParams(apiParams)
  }, [setParams, apiParams])

  const response = useMemo(() => {
    if (api.loaded && api.data) {
      return api.data
    }
    return null
  }, [api.loaded, api.data])

  return {
    response,
    setParams,
  }
}

export default useBlanketApprovalDetails
