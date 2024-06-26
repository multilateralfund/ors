import cx from 'classnames'

const DATA_INCOME = {
  bilateral_cooperation: '187,767,175',
  cash_payments: '4,239,242,826',
  interest_earned: '256,310,311',
  miscellaneous_income: '21,841,581',
  promissory_notes: '0',
  total_income: '4,705,161,892',
}

const DATA_ALLOCATIONS = [
  { label: 'UNDP', value: '1,029,932,433' },
  { label: 'UNEP', value: '423,780,713' },
  { label: 'UNIDO', value: '1,022,487,150' },
  { label: 'World Bank', value: '1,310,140,942' },
  { label: 'Unspecified projects', value: '-' },
  { label: 'Less Adjustments', value: '-' },
  { className: '!bg-transparent' },
  {
    className: '!bg-primary text-white',
    label: 'Total allocations to implementing agencies',
    value: '3,786,341,238',
  },
]

const DATA_PROVISIONS = [
  {
    label: 'Secretariat and Executive Committee costs  (1991-2025)',
    sub: '(includes provision for staff contracts into 2025)',
    value: '161,339,318',
  },
  { label: 'Treasury fees (2003-2025)', value: '11,556,982' },
  { label: 'Monitoring and Evaluation costs (1999-2023)', value: '3,812,244' },
  { label: 'Technical Audit costs (1998-2010)', value: '1,699,806' },
  {
    label: 'Information Strategy costs (2003-2004)',
    sub: '(includes provision for Network maintenance costs for 2004)',
    value: '104,750',
  },
  { label: 'Bilateral cooperation', value: '187,767,175' },
  {
    label: "Provision for fixed-exchange-rate mechanism's fluctuations",
    sub: '(losses/(gains) in value)',
    value: '29,540,239',
  },
  {
    className: '!bg-primary text-white',
    label: 'Total allocations and  provisions',
    value: '4,182,161,753',
  },
]

const DATA_TOTAL = [
  {
    label: (
      <>
        Cash<sup>***</sup>
      </>
    ),
    value: '523,000,140',
  },
  { label: 'Promissory Notes:' },
  { className: '!bg-transparent' },
  {
    className: '!bg-primary text-white',
    label: 'BALANCE AVAILABLE FOR NEW ALLOCATIONS',
    value: '523,000,140',
  },
]

function ListItem(props) {
  const { label, value } = props
  return (
    <li className={cx('mb-2 flex', props.className)}>
      <span className={cx('font-bold', { 'w-80': value })}>{label}</span>
      {value && <span className="ml-0">{value}</span>}
    </li>
  )
}

function SummaryCard(props) {
  const { label, value } = props
  return (
    <div className="flex h-[150px] w-[250px] flex-col justify-between rounded-lg bg-[#F5F5F5] px-4 py-4">
      <div className="text-xl font-medium uppercase">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function CashCard(props) {
  const { className, label, sub, value } = props
  return (
    <li
      className={cx(
        'flex h-[90px] w-[516px] items-center justify-between rounded-lg bg-[#F5F5F5] px-4 py-4',
        className,
      )}
    >
      <div className="w-[280px]">
        <div className="text-xl font-medium">{label}</div>
        <div className="text-lg font-normal">{sub}</div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </li>
  )
}

function DashboardView() {
  return (
    <>
      <h2 className="m-0 text-3xl">STATUS OF THE FUND</h2>
      <p className="m-0 text-xl">as of 15 May 2024 ( US Dollars )</p>

      <div className="flex">
        <div className="w-7/12">
          <h3 className="text-2xl">OVERVIEW</h3>

          <div className="flex items-center gap-x-4">
            <SummaryCard label="Cash fund ballance" value={'NNN,NNN,NNN'} />
            <SummaryCard
              label="Ballance available for 2021-2023"
              value={'NNN,NNN,NNN'}
            />
            <SummaryCard
              label="Pledge contribution received for 2021-2023"
              value={'89%'}
            />
            <SummaryCard label="FERM loss" value={'NN,NNN,NNN'} />
          </div>

          <h3 className="text-2xl">INCOME</h3>

          <ul className="flex list-none flex-wrap gap-4 pl-0">
            <CashCard
              label="Cash payments including note encashments"
              value={DATA_INCOME.cash_payments}
            />
            <CashCard
              label="Promissory notes held"
              value={DATA_INCOME.promissory_notes}
            />
            <CashCard
              label="Bilateral cooperation"
              value={DATA_INCOME.bilateral_cooperation}
            />
            <CashCard
              value={DATA_INCOME.interest_earned}
              label={
                <>
                  Interest earned <sup>*</sup>
                </>
              }
            />
            <CashCard
              label="Miscellaneous income"
              value={DATA_INCOME.miscellaneous_income}
            />
            <CashCard
              className="!bg-primary text-white"
              label="Total Income"
              value={DATA_INCOME.total_income}
            />
          </ul>

          <h3 className="text-2xl">
            ALLOCATIONS<sup>**</sup> AND PROVISIONS
          </h3>

          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {DATA_ALLOCATIONS.map((item, idx) => (
              <CashCard key={idx} {...item} />
            ))}
          </ul>
          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {DATA_PROVISIONS.map((item, idx) => (
              <CashCard key={idx} {...item} />
            ))}
          </ul>
          <ul className="flex list-none flex-wrap gap-4 pl-0">
            {DATA_TOTAL.map((item, idx) => (
              <CashCard key={idx} {...item} />
            ))}
          </ul>
        </div>

        <div className="w-5/12">
          <br className="m-5 leading-7" />
          <div className="flex flex-col gap-8">
            <div className="h-[562px] w-[690px] rounded-lg bg-[#F5F5F5]"></div>
            <div className="h-[464px] w-[690px] rounded-lg bg-[#F5F5F5]"></div>
          </div>
        </div>
      </div>
      <div>
        <p className="my-0">
          <sup>*</sup> Includes interest amount US $1,553,069 earned by FECO/MEP
          (China).
        </p>
        <p className="my-0">
          <sup>**</sup> Amounts reflect net approvals for which resources are
          transferred to Implementing Agencies. The Secretariat budget reflects
          actual costs as per the final 2021 and preliminary 2022 accounts of
          the Fund and approved amounts for 2020 - 2025.
        </p>
        <p className="my-0">
          <sup>***</sup> This amount includes US $246 million balance carried
          forward from 2018-2020 triennium, which is to be used after 2023 as
          per the fifth extraordinary MoP decision Ex.V/1(2){' '}
        </p>
      </div>
    </>
  )
}

export default DashboardView
