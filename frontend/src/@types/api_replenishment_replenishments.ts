// Response from /api/replenishment/replenishments/

export type ApiReplenishment = {
  amount: number
  end_year: number
  id: number
  scales_of_assessment_versions: ApiReplenishmentsSAVersion[]
  start_year: number
}

export type ApiReplenishmentsSAVersion = {
  comment: string
  decision_number: string
  decision_pdf: any
  id: number
  is_final: boolean
  meeting_number: string
  replenishment: number
  version: number
}

export type ApiReplenishments = ApiReplenishment[]

export type ApiAsOfDate = {
  as_of_date: string
}

export type ApiBudgetYears = {
  secretariat_and_executive_committee: number
  treasury_fees: number
  monitoring_fees: number
} | null
