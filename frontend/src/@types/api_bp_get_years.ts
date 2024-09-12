// Response from /api/business-plan/get-years

export interface ApiBPYearRange {
  max_year: number
  min_year: number
  year_end: number
  year_start: number
}

export type ApiBPYearRanges = ApiBPYearRange[]
