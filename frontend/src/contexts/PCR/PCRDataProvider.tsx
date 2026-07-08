import { PropsWithChildren } from 'react'

import PCRDataContext from './PCRDataContext'
import useApi from '@ors/hooks/useApi'

const PCRDataProvider = (props: PropsWithChildren) => {
  const { children } = props

  const { data: statuses } = useApi({
    options: { withStoreCache: true },
    path: 'api/project-statuses/',
  })

  return (
    <PCRDataContext.Provider value={{ statuses }}>
      {children}
    </PCRDataContext.Provider>
  )
}

export default PCRDataProvider
