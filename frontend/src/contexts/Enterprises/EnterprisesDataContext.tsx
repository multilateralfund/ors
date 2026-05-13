import { createContext } from 'react'

interface EnterprisesDataContextProps {
  statuses: {
    id: number
    name: string
  }[]
}

const EnterprisesDataContext = createContext<EnterprisesDataContextProps>(
  null as unknown as EnterprisesDataContextProps,
)

export default EnterprisesDataContext
