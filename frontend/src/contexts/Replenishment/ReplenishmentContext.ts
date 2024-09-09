import { ApiReplenishments } from '@ors/types/api_replenishment_replenishments'

import { createContext } from 'react'

interface ReplenishmentContextType {
  countries: any[]
  countriesSOA: any[]
  isCountryUser: boolean
  isSecretariat: boolean
  isTreasurer: boolean
  periodOptions: { label: string; value: string }[]
  periods: ApiReplenishments
  refetchData: () => void
}

const ReplenishmentContext = createContext<ReplenishmentContextType>(
  {} as ReplenishmentContextType,
)

export default ReplenishmentContext
