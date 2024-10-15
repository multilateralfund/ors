export interface SoCRow {
  agreed_contributions: number
  bilateral_assistance: number
  cash_payments: number
  country: string
  country_id: number
  gain_loss?: number
  outstanding_contributions: number
  promissory_notes: number
}

export interface SoCExtraRow {
  agreed_contributions?: null | number
  bilateral_assistance?: null | number
  cash_payments?: null | number
  country?: JSX.Element | null | string
  country_id?: null | number
  country_to_display?: string
  disputed_id?: number
  gain_loss?: null | number
  outstanding_contributions?: null | number
  promissory_notes?: null | number
}

export interface Contributions {
  bilateral_assistance_countries: number
  bilateral_assistance_countries_percentage: number

  contributions: number
  contributions_advance: number
  contributions_in_full: number
  contributions_percentage: number

  countries: number
  outstanding_contributions: number

  outstanding_contributions_percentage: number

  promissory_notes_countries: number
  promissory_notes_countries_percentage: number
}

export interface SummaryContributions {
  contributions: number
  contributions_advance: number
  outstanding_contributions: number
  percentage_total_paid_current_year?: null | number
}

export interface AnnualContributions {
  contributions: number
  contributions_advance: number
  outstanding_contributions: number
  percentage_total_paid_current_year?: null | number
}
export interface TriennialContributions {
  contributions: number
  contributions_advance: number
  outstanding_contributions: number
  percentage_total_paid_current_year?: null | number
}

export interface SCViewProps {
  period?: string
  year?: string
}

export interface DisputedContributionDialogProps {
  countryOptions: { country: string; country_id: number }[]
  meetingOptions: { label: number; value: string }[]

  refetchSCData: () => void
  year: string
}

export interface BilateralAssistanceDialogProps {
  countryOptions: { country: string; country_id: number }[]
  meetingOptions: { label: number; value: string }[]
  refetchSCData: () => void
  rows: SoCRow[]
  year: string
}
