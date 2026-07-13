import { PropsWithChildren } from 'react'

import PCRDataContext from './PCRDataContext'
import useApi from '@ors/hooks/useApi'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { data: statuses } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-statuses/',
  })

  const { data: regions } = useApi({
    options: {
      withStoreCache: true,
      params: { location_type: 'Region' },
    },
    path: 'api/countries/',
  })

  return (
    <PCRDataContext.Provider value={{ statuses, regions }}>
      {children}
    </PCRDataContext.Provider>
  )
}

export default PCRDataProvider
