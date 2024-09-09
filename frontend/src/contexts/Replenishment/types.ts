import { ApiReplenishment } from '@ors/types/api_replenishment_replenishments'
import {
  ApiReplenishmentSoA,
  ApiReplenishmentSoAVersion,
} from '@ors/types/api_replenishment_scales_of_assessment'

import { Dispatch, SetStateAction } from 'react'

export interface ISoAContext {
  contributions: ApiReplenishmentSoA
  refetchData: () => void
  replenishment?: ApiReplenishment
  setCurrentVersion: Dispatch<SetStateAction<null | number>>
  version: ApiReplenishmentSoAVersion | null
  versions: ApiReplenishmentSoAVersion[]
}

export interface ISoAProvider {
  children: React.ReactNode
  startYear: string
}
