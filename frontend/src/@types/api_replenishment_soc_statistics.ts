// Response from /api/replenishment/status-of-contributions/statistics

export type ApiReplenishmentSoCStatistic = {
  agreed_contributions: number
  bilateral_assistance: number
  cash_payments: number
  disputed_contributions: null | number
  end_year: number
  interest_earned: number
  miscellaneous_income: number
  outstanding_ceit: number
  outstanding_contributions: number
  payment_pledge_percentage: number
  percentage_outstanding_agreed: number
  percentage_outstanding_ceit: number
  promissory_notes: number
  start_year: number
  total_income: number
  total_payments: number
}

export type ApiReplenishmentSoCStatistics = ApiReplenishmentSoCStatistic[]
