import { createContext } from 'react'

import { Country } from '@ors/types/store'
import { ApiAgency } from '@ors/types/api_agencies'

interface BPDataContextProps {
  agencies: ApiAgency[]
  countries: Country[]
}

const BPDataContext = createContext<BPDataContextProps>(
  null as unknown as BPDataContextProps,
)

export default BPDataContext
