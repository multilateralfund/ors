import { PropsWithChildren } from 'react'

import PCRListingContext from './PCRListingContext'
import useApi from '@ors/hooks/useApi'

const PCRListingProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { data: regions } = useApi({
    options: {
      withStoreCache: true,
      params: { location_type: 'Region' },
    },
    path: 'api/countries/',
  })

  return (
    <PCRListingContext.Provider value={{ regions }}>
      {children}
    </PCRListingContext.Provider>
  )
}

export default PCRListingProvider
