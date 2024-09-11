// Response from /api/replenishment/status-of-contributions/*

import { Country } from './store'

export type ApiReplenishmentSoCStatus = {
  agreed_contributions: number
  bilateral_assistance: number
  cash_payments: number
  country: Country
  gain_loss?: number
  outstanding_contributions: number
  promissory_notes: number
}

export type ApiReplenishmentSoCCeit = {
  agreed_contributions: number
  bilateral_assistance: number
  cash_payments: number
  outstanding_contributions: number
  promissory_notes: number
}

export type ApiReplenishmentSoCTotal = {
  agreed_contributions: number
  agreed_contributions_with_disputed: number
  bilateral_assistance: number
  cash_payments: number
  gain_loss: number
  outstanding_contributions: number
  outstanding_contributions_with_disputed: number
  promissory_notes: number
}

export type ApiReplenishmentSoCDisputedPerCountry = {
  amount: number
  comment: string
  country: Country
  id: number
  year: number
}

export type ApiReplenishmentSoC = {
  ceit: ApiReplenishmentSoCCeit
  ceit_countries: Country[]
  disputed_contributions: number
  disputed_contributions_per_country: ApiReplenishmentSoCDisputedPerCountry[]
  percentage_total_paid_current_year?: number
  status_of_contributions: ApiReplenishmentSoCStatus[]
  total: ApiReplenishmentSoCTotal
}
