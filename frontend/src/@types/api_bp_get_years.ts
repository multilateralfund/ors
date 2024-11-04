// Response from /api/business-plan/get-years

export interface ApiBPYearRange {
  /** Activities max year. Null when BP has no activities. */
  max_year: null | number
  /** Activities min year. Null when BP has no activities. */
  min_year: null | number
  year_end: number
  year_start: number
}

export type ApiBPYearRanges = ApiBPYearRange[]
