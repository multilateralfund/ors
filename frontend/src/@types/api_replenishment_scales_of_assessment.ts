// Response from /api/replenishment/scales-of-assessment

import { ApiReplenishment } from './api_replenishment_replenishments'
import { Country } from './store'

export type ApiReplenishmentSoAEntry = {
  adjusted_scale_of_assessment: number
  amount: number
  amount_local_currency: number
  average_inflation_rate: number
  bilateral_assistance_amount: number
  country: Country
  currency: string
  exchange_rate: number
  id: number

  /**
   * XXX: Backend doesn't yet contain this property!
   */
  opted_for_ferm?: undefined

  override_adjusted_scale_of_assessment: number
  override_qualifies_for_fixed_rate_mechanism: boolean
  qualifies_for_fixed_rate_mechanism: boolean
  replenishment: ApiReplenishment
  un_scale_of_assessment: number
  version: ApiReplenishmentSoAVersion
  yearly_amount: number
  yearly_amount_local_currency: number
}

export type ApiReplenishmentSoAVersion = {
  comment: string
  decision_number: string
  decision_pdf: null
  id: number
  is_final: boolean
  meeting_number: string
  replenishment: number
  version: number
}

export type ApiReplenishmentSoA = ApiReplenishmentSoAEntry[]
