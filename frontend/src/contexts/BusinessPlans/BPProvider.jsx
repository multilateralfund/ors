import { useMemo } from 'react'

import { useParams } from 'next/navigation'

import useApi from '@ors/hooks/useApi'
import { useStore } from '@ors/store'

import BPContext from './BPContext'

const BP_PER_PAGE = 20

function BPProvider(props) {
  const { children } = props
  const pathParams = useParams()
  const { agency, period } = pathParams
  const commonSlice = useStore((state) => state.common)

  const currentAgency = useMemo(() => {
    return commonSlice.agencies.data.find((item) => item.name === agency)
  }, [agency, commonSlice.agencies.data])

  const { data, loaded, loading, setParams } = useApi({
    options: {
      params: {
        agency_id: currentAgency?.id,
        limit: BP_PER_PAGE,
        offset: 0,
        year_end: period.split('-')[1],
        year_start: period.split('-')[0],
      },
      withStoreCache: true,
    },
    path: 'api/business-plan-record/',
  })

  return (
    <BPContext.Provider
      value={{
        data,
        loaded,
        loading,
        setParams,
      }}
    >
      {children}
    </BPContext.Provider>
  )
}

export default BPProvider
