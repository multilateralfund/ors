import { PropsWithChildren } from 'react'

import EnterprisesDataContext from './EnterprisesDataContext'
import useApi from '@ors/hooks/useApi'

interface EnterprisesProviderProps extends PropsWithChildren {}

const EnterprisesDataProvider = (props: EnterprisesProviderProps) => {
  const { children } = props

  const { data: statuses } = useApi({
    options: {
      withStoreCache: true,
    },
    path: '/api/enterprise-statuses/',
  })

  return (
    <EnterprisesDataContext.Provider
      value={{
        statuses,
      }}
    >
      {children}
    </EnterprisesDataContext.Provider>
  )
}

export default EnterprisesDataProvider
