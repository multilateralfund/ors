// Response from /api/replenishment/replenishments/

import type { ApiReplenishmentSoAVersion } from './api_replenishment_scales_of_assessment'

export type ApiReplenishment = {
  amount: number
  end_year: number
  id: number
  scales_of_assessment_versions: ApiReplenishmentSoAVersion[]
  start_year: number
}

export type ApiReplenishments = ApiReplenishment[]

export type ApiAsOfDate = {
  as_of_date: string
}

export type ApiBudgetYears = {
  monitoring_fees: number
  secretariat_and_executive_committee: number
  treasury_fees: number
} | null
