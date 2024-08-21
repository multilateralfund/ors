import useApi from '@ors/hooks/useApi'

const OVERVIEW = {
  balance: { label: 'cash fund balance', value: null },
  gain_loss: { label: 'ferm loss', value: null },
  payment_pledge_percentage: {
    label: 'pledged contribution received for 2021-2023',
    percentage: true,
    value: null,
  },
}

const OVERVIEW_INDICATORS = {
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

const INCOME = {
  bilateral_assistance: { label: 'Bilateral cooperation', value: null },
  cash_payments: {
    label: 'Cash payments including note encashment',
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

const ALLOCATIONS = {
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

const PROVISIONS = {
  bilateral_assistance: { label: 'Bilateral cooperation', value: null },
  information_strategy: {
    label: 'Information Strategy costs (2003-2004)',
    sub_text: '(inc. provision for Network maintenance for 2004)',
    value: null,
  },
  monitoring_fees: {
    label: 'Monitoring and evaluation costs (1999-2023)',
    value: null,
  },
  staff_contracts: {
    label: 'Secretariat and Executive Committee costs (1991-2025)',
    sub_text: '(inc. provision for staff contracts into 2025)',
    value: null,
  },
  technical_audit: {
    label: 'Technical Audit costs (1998-2010)',
    value: null,
  },
  total: {
    label: 'Total allocations and provisions',
    total: true,
    value: null,
  },
  treasury_fees: { label: 'Treasury fees (2003-2025)', value: null },
}

const calculateTotal = (obj) => {
  return Object.keys(obj)
    .filter((key) => key !== 'total' && obj[key].value != null)
    .reduce((acc, key) => acc + obj[key].value, 0)
}

const updateObjectValues = (fetchedData) => {
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

  // Update PROVISIONS object
  PROVISIONS.staff_contracts.value = fetchedData.allocations.staff_contracts
  PROVISIONS.treasury_fees.value = fetchedData.allocations.treasury_fees
  PROVISIONS.monitoring_fees.value = fetchedData.allocations.monitoring_fees
  PROVISIONS.technical_audit.value = fetchedData.allocations.technical_audit
  PROVISIONS.information_strategy.value =
    fetchedData.allocations.information_strategy
  PROVISIONS.bilateral_assistance.value =
    fetchedData.allocations.bilateral_assistance
  PROVISIONS.total.value =
    calculateTotal(PROVISIONS) +
    ALLOCATIONS.total.value +
    OVERVIEW.gain_loss.value
}

function useGetDashboardData() {
  const { data, loading, setParams } = useApi({
    options: {},
    path: '/api/replenishment/dashboard',
  })

  let formData
  let newData
  if (data) {
    updateObjectValues(data)
    formData = {
      ...data.overview,
      ...data.allocations,
      ...data.income,
    }
    newData = {
      allocations: ALLOCATIONS,
      charts: data.charts,
      income: INCOME,
      overview: OVERVIEW,
      overviewIndicators: OVERVIEW_INDICATORS,
      provisions: PROVISIONS,
    }
  } else {
    formData = {}
    newData = {}
  }

  return { formData, invalidateDataFn: setParams, loading, newData }
}

export default useGetDashboardData
