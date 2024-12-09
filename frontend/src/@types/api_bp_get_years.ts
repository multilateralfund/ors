// Response from /api/business-plan/get-years

export interface ApiBPYearRange {
  year_end: number
  year_start: number
  status?: string[]
}

export type ApiBPYearRanges = ApiBPYearRange[]
