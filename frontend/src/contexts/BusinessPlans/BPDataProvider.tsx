import { PropsWithChildren } from 'react'

import BPDataContext from './BPDataContext'
import useApi from '@ors/hooks/useApi'

interface BPDataProviderProps extends PropsWithChildren {}

const BPDataProvider = (props: BPDataProviderProps) => {
  const { children } = props

  const { data: agencies } = useApi({
    options: {
      withStoreCache: false,
      params: {
        include_all_agencies_option: 'true',
      },
    },
    path: 'api/business-plan/agencies/',
  })

  const { data: countries } = useApi({
    options: {
      withStoreCache: false,
    },
    path: '/api/business-plan/countries/',
  })

  return (
    <BPDataContext.Provider
      value={{
        agencies,
        countries,
      }}
    >
      {children}
    </BPDataContext.Provider>
  )
}

export default BPDataProvider
