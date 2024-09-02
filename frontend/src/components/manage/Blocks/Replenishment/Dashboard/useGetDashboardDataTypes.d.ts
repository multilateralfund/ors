import useApi from '@ors/hooks/useApi'

interface IExternalIncome {
  end_year: number
  interest_earned: number
  miscellaneous_income: number
  start_year: number
}

interface IDashboardDataApiResponse {
  allocations: {
    bilateral_assistance: number
    gain_loss: number
    information_strategy: number
    monitoring_fees: number
    staff_contracts: number
    technical_audit: number
    treasury_fees: number
    undp: number
    unep: number
    unido: number
    world_bank: number
  }
  as_of_date: string
  charts: {
    outstanding_pledges: {
      end_year: number
      outstanding_pledges: number
      start_year: number
    }[]
    payments: { end_year: number; start_year: number; total_payments: number }[]
    pledged_contributions: {
      agreed_pledges: number
      end_year: number
      start_year: number
    }[]
  }
  external_income: IExternalIncome[]
  income: {
    bilateral_assistance: number
    cash_payments: number
    interest_earned: number
    miscellaneous_income: number
    promissory_notes: number
  }
  overview: {
    balance: number
    gain_loss: number
    parties_have_to_pay_count: number
    parties_paid_count: number
    parties_paid_in_advance_count: number
    payment_pledge_percentage: number
  }
}

interface IEntry {
  label: string
  value: null | number
}

interface IPercentageEntry extends IEntry {
  percentage: boolean
}

interface ITotalEntry extends IEntry {
  total: boolean
}

interface IOVERVIEW {
  balance: IEntry
  gain_loss: IEntry
  payment_pledge_percentage: IPercentageEntry
}

interface IOVERVIEW_INDICATORS {
  advance_contributions: IEntry
  contributions: IEntry
  outstanding_contributions: IEntry
}

interface IINCOME {
  bilateral_assistance: IEntry
  cash_payments: IEntry
  interest_earned: {
    label: React.ReactNode
    value: null | number
  }
  miscellaneous_income: IEntry
  promissory_notes: IEntry
  total: ITotalEntry
}

interface IALLOCATIONS {
  total: ITotalEntry
  undp: IEntry
  unep: IEntry
  unido: IEntry
  world_bank: IEntry
}

interface IPROVISIONS {
  bilateral_assistance: IEntry
  gain_loss: IEntry
  information_strategy: { sub_text: string } & IEntry
  monitoring_fees: IEntry
  staff_contracts: { sub_text: string } & IEntry
  technical_audit: IEntry
  total: ITotalEntry
  treasury_fees: IEntry
}

interface IDashboardData {
  allocations: IALLOCATIONS
  asOfDate: IDashboardDataApiResponse['as_of_date']
  charts: IDashboardDataApiResponse['charts']
  income: IINCOME
  overview: IOVERVIEW
  overviewIndicators: IOVERVIEW_INDICATORS
  provisions: IPROVISIONS
}

type IFormData = {
  external_income_end_year: IDashboardDataApiResponse['external_income'][0]['end_year']
  external_income_start_year: IDashboardDataApiResponse['external_income'][0]['start_year']
  interest_earned: IDashboardDataApiResponse['external_income'][0]['interest_earned']
  miscellaneous_income: IDashboardDataApiResponse['external_income'][0]['miscellaneous_income']
} & IDashboardDataApiResponse['allocations'] &
  IDashboardDataApiResponse['overview']
