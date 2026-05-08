import { createContext } from 'react'

import { StatusType } from '@ors/components/manage/Blocks/ProjectsListing/Enterprises/interfaces'

interface EnterprisesDataContextProps {
  statuses: StatusType[]
}

const EnterprisesDataContext = createContext<EnterprisesDataContextProps>(
  null as unknown as EnterprisesDataContextProps,
)

export default EnterprisesDataContext
