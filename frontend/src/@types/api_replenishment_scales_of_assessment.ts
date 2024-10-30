// Response from /api/replenishment/scales-of-assessment

import { ApiReplenishment } from './api_replenishment_replenishments'
import { Country } from './store'

export type ApiReplenishmentSoAEntry = {
  adjusted_scale_of_assessment: null | string
  amount: null | string
  amount_local_currency: null | string
  average_inflation_rate: null | string
  bilateral_assistance_amount: string
  country: Country
  currency: string
  exchange_rate: null | string
  id: number
  opted_for_ferm: boolean | null
  override_adjusted_scale_of_assessment: null | string
  override_qualifies_for_fixed_rate_mechanism: boolean
  qualifies_for_fixed_rate_mechanism: boolean
  replenishment: ApiReplenishment
  un_scale_of_assessment: null | string
  version: ApiReplenishmentSoAVersion
  yearly_amount: null | string
  yearly_amount_local_currency: null | string
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
