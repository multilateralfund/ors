import { createContext } from 'react'

import { Country } from '@ors/types/store'

type PCRListingContextProps = { regions: Country[] }

const PCRListingContext = createContext<PCRListingContextProps>(
  null as unknown as PCRListingContextProps,
)

export default PCRListingContext
