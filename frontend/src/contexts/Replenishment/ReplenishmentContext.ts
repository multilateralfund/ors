import { ApiAsOfDate, ApiBudgetYears, ApiReplenishments } from '@ors/types/api_replenishment_replenishments'
import { Country } from '@ors/types/store'

import { createContext } from 'react'

interface ReplenishmentContextType {
  asOfDate: ApiAsOfDate
  budgetYears: ApiBudgetYears | null
  countries: Country[]
  countriesSOA: Country[]
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
