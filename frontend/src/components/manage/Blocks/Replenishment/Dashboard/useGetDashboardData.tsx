'use client'

import type {
  IALLOCATIONS,
  IDashboardData,
  IDashboardDataApiResponse,
  IFormData,
  IINCOME,
  IOVERVIEW,
  IOVERVIEW_INDICATORS,
  IPROVISIONS,
} from './useGetDashboardDataTypes'
import type { ApiBudgetYears, ApiReplenishment } from '@ors/types/api_replenishment_replenishments'

import { useContext } from 'react'

import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { getFloat, sumMaybeNumbers } from '@ors/helpers/Utils/Utils'
import useApi from '@ors/hooks/useApi'

const OVERVIEW: IOVERVIEW = {
  balance: { label: 'cash fund balance', value: null },
  gain_loss: { label: 'ferm loss', value: null },
  payment_pledge_percentage: {
    label: 'pledged contribution received for 2021-2023',
    percentage: true,
    value: null,
  },
}

const OVERVIEW_INDICATORS: IOVERVIEW_INDICATORS = {
  advance_contributions: {
    label: 'parties have made their contributions in advance',
    value: null,
  },
  contributions: {
    label: 'parties have made their contributions',
    value: null,
  },
  outstanding_contributions: {
    label: 'parties have outstanding contributions',
    value: null,
  },
}

const INCOME: IINCOME = {
  bilateral_assistance: { label: 'Bilateral cooperation', value: null },
  cash_payments: {
    info_text: 'Including note encashments.',
    label: 'Cash payments',
    value: null,
  },
  interest_earned: {
    label: (
      <>
        Interest earned <sup>*</sup>
      </>
    ),
    value: null,
  },
  miscellaneous_income: { label: 'Miscellaneous income', value: null },
  promissory_notes: { label: 'Promissory notes held', value: null },
  total: { label: 'Total income', total: true, value: null },
}

const ALLOCATIONS: IALLOCATIONS = {
  total: {
    label: 'Total allocations to implementing agencies',
    total: true,
    value: null,
  },
  undp: { label: 'UNDP', value: null },
  unep: { label: 'UNEP', value: null },
  unido: { label: 'UNIDO', value: null },
  world_bank: { label: 'World Bank', value: null },
}

function buildProvisions(
  period: ApiReplenishment | null,
  budgetYears: ApiBudgetYears,
  data: IDashboardDataApiResponse,
) {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1

  const periodEnd = period ? period.end_year : nextYear

  const monitoringFeesEnd = budgetYears?.monitoring_fees || currentYear
  const staffContractsEnd = budgetYears?.secretariat_and_executive_committee || periodEnd
  const treasuryFeesEnd = budgetYears?.treasury_fees || periodEnd

  const result: IPROVISIONS = {
    bilateral_assistance: { label: 'Bilateral cooperation', value: null },
    gain_loss: {
      label: 'FERM loss',
      negative_label: 'FERM gain',
      value: null,
    },
    information_strategy: {
      info_text: 'Including provision for Network maintenance for 2004',
      label: 'Information Strategy\n (2003-2004)',
      sub_text: '(inc. provision for Network maintenance for 2004)',
      value: null,
    },
    monitoring_fees: {
      label: `Monitoring and evaluation\n (1999-${monitoringFeesEnd})`,
      value: null,
    },
    staff_contracts: {
      info_text: `Including provision for staff contracts into ${staffContractsEnd}.`,
      label: `Secretariat and Executive Committee (1991-${staffContractsEnd})`,
      sub_text: `(inc. provision for staff contracts into ${staffContractsEnd})`,
      value: null,
    },
    technical_audit: {
      label: 'Technical Audit\n (1998-2010)',
      value: null,
    },
    total: {
      label: 'Total allocations and provisions',
      total: true,
      value: null,
    },
    treasury_fees: { label: `Treasury fees\n (2003-${treasuryFeesEnd})`, value: null },
  }

  result.staff_contracts.value = data.allocations.staff_contracts
  result.treasury_fees.value = data.allocations.treasury_fees
  result.monitoring_fees.value = data.allocations.monitoring_fees
  result.technical_audit.value = data.allocations.technical_audit
  result.information_strategy.value = data.allocations.information_strategy
  result.bilateral_assistance.value = data.allocations.bilateral_assistance
  result.gain_loss.value = data.overview.gain_loss
  result.total.value = sumMaybeNumbers([
    calculateTotal(result),
    data.allocations.undp,
    data.allocations.unep,
    data.allocations.unido,
    data.allocations.world_bank,
    data.overview.gain_loss,
  ])
  return result
}

function calculateTotal(obj: IALLOCATIONS | IINCOME | IPROVISIONS) {
  let result = 0

  for (
    let i = 0, keys = Object.keys(obj) as (keyof typeof obj)[];
    i < keys.length;
    i++
  ) {
    if (keys[i] !== 'total') {
      result += getFloat(obj[keys[i]].value)
    }
  }

  return result
}

function getActivePeriod(periods: ApiReplenishment[]) {
  // Return the latest period with a final SoA.
  let result = null
  for (let i = 0; result == null && i < periods.length; i++) {
    for (let j = 0; j < periods[i].scales_of_assessment_versions.length; j++) {
      if (periods[i].scales_of_assessment_versions[j].is_final) {
        result = periods[i]
      }
    }
  }
  return result
}

const updateObjectValues = (fetchedData: IDashboardDataApiResponse) => {
  // Update OVERVIEW object
  OVERVIEW.balance.value = fetchedData.overview.balance
  OVERVIEW.payment_pledge_percentage.value =
    fetchedData.overview.payment_pledge_percentage
  OVERVIEW.gain_loss.value = fetchedData.overview.gain_loss

  // Update OVERVIEW_INDICATORS object
  OVERVIEW_INDICATORS.advance_contributions.value =
    fetchedData.overview.parties_paid_in_advance_count
  OVERVIEW_INDICATORS.contributions.value =
    fetchedData.overview.parties_paid_count
  OVERVIEW_INDICATORS.outstanding_contributions.value =
    fetchedData.overview.parties_have_to_pay_count

  // Update INCOME object
  INCOME.cash_payments.value = fetchedData.income.cash_payments
  INCOME.promissory_notes.value = fetchedData.income.promissory_notes
  INCOME.bilateral_assistance.value = fetchedData.income.bilateral_assistance
  INCOME.interest_earned.value = fetchedData.income.interest_earned
  INCOME.miscellaneous_income.value = fetchedData.income.miscellaneous_income
  INCOME.total.value = calculateTotal(INCOME)

  // Update ALLOCATIONS object
  ALLOCATIONS.undp.value = fetchedData.allocations.undp
  ALLOCATIONS.unep.value = fetchedData.allocations.unep
  ALLOCATIONS.unido.value = fetchedData.allocations.unido
  ALLOCATIONS.world_bank.value = fetchedData.allocations.world_bank
  ALLOCATIONS.total.value = calculateTotal(ALLOCATIONS)
}

function useGetDashboardData() {
  const { data, loading, setParams } = useApi<IDashboardDataApiResponse>({
    options: {},
    path: '/api/replenishment/dashboard',
  })

  const ctx = useContext(ReplenishmentContext)
  const activePeriod = getActivePeriod(ctx.periods)
  const budgetYears = ctx.budgetYears

  let formData: IFormData | Record<string, never>
  let newData: IDashboardData | Record<string, never>
  if (data) {
    updateObjectValues(data)
    formData = {
      ...data.overview,
      ...data.allocations,
      external_income_end_year: data.external_income[0].end_year,
      external_income_start_year: data.external_income[0].start_year,
      interest_earned: data.external_income[0].interest_earned,
      miscellaneous_income: data.external_income[0].miscellaneous_income,
    }
    newData = {
      agencies: data.agencies,
      allocations: ALLOCATIONS,
      asOfDate: data.as_of_date,
      charts: data.charts,
      income: INCOME,
      overview: OVERVIEW,
      overviewIndicators: OVERVIEW_INDICATORS,
      provisions: buildProvisions(activePeriod, budgetYears, data),
    }
  } else {
    formData = {}
    newData = {}
  }

  return { formData, invalidateDataFn: setParams, loading, newData }
}

export default useGetDashboardData
