import cx from 'classnames'

const DATA_INCOME: any = {
  bilateral_cooperation: '187,767,175',
  cash_payments: '4,239,242,826',
  interest_earned: '256,310,311',
  miscellaneous_income: '21,841,581',
  promissory_notes: '0',
  total_income: '4,705,161,892',
}

const DATA_ALLOCATIONS: any = [
  { label: 'UNDP', value: '1,029,932,433' },
  { label: 'UNEP', value: '423,780,713' },
  { label: 'UNIDO', value: '1,022,487,150' },
  { label: 'World Bank', value: '1,310,140,942' },
  { label: 'Unspecified projects', value: '-' },
  { label: 'Less Adjustments', value: '-' },
  {
    className: 'font-bold border border-solid border-x-0 py-2',
    label: 'Total allocations to implementing agencies',
    value: '3,786,341,238',
  },
]

const DATA_PROVISIONS: any = [
  { label: 'Secretariat and Executive Committee costs  (1991-2025)' },
  {
    label: ' -     includes provision for staff contracts into 2025',
    value: '161,339,318',
  },
  { label: 'Treasury fees (2003-2025)', value: '11,556,982' },
  { label: 'Monitoring and Evaluation costs (1999-2023)', value: '3,812,244' },
  { label: 'Technical Audit costs (1998-2010)', value: '1,699,806' },
  { label: 'Information Strategy costs (2003-2004)' },
  {
    label: ' -     includes provision for Network maintenance costs for 2004',
    value: '104,750',
  },
  { label: 'Bilateral cooperation', value: '187,767,175' },
  { label: "Provision for fixed-exchange-rate mechanism's fluctuations" },
  { label: ' -     losses/(gains) in value', value: '29,540,239' },
  {
    className: 'font-bold border border-solid border-x-0 py-2',
    label: 'Total allocations and  provisions',
    value: '4,182,161,753',
  },
]

const DATA_TOTAL: any = [
  {
    label: (
      <>
        Cash<sup>***</sup>
      </>
    ),
    value: '523,000,140',
  },
  { label: 'Promissory Notes:' },
  {
    className: 'font-bold border-double border-x-0 py-2',
    label: 'BALANCE AVAILABLE FOR NEW ALLOCATIONS',
    value: '523,000,140',
  },
]

function ListItem(props: any) {
  const { label, value } = props
  return (
    <li className={cx('mb-2 flex', props.className)}>
      <span className={cx('font-bold', { 'w-80': value })}>{label}</span>
      {value && <span className="ml-0">{value}</span>}
    </li>
  )
}

function DashboardView() {
  return (
    <div>
      <h2>STATUS OF THE FUND FROM 1991-2023 (IN US DOLLARS)</h2>
      <h3 className="mb-0">INCOME</h3>
      <p className="m-0">Contributions received:</p>
      <ul className="list-none pl-0">
        <ListItem
          label="Cash payments including note encashments"
          value={DATA_INCOME.cash_payments}
        />
        <ListItem
          label="Promissory notes held"
          value={DATA_INCOME.promissory_notes}
        />
        <ListItem
          label="Bilateral cooperation"
          value={DATA_INCOME.bilateral_cooperation}
        />
        <ListItem
          value={DATA_INCOME.interest_earned}
          label={
            <>
              Interest earned <sup>*</sup>
            </>
          }
        />
        <ListItem
          label="Miscellaneous income"
          value={DATA_INCOME.miscellaneous_income}
        />
        <ListItem
          className="font-bold"
          label="Total Income"
          value={DATA_INCOME.total_income}
        />
      </ul>
      <h3 className="mb-0">
        ALLOCATIONS<sup>**</sup> AND PROVISIONS
      </h3>
      <ul className="list-none pl-0">
        {DATA_ALLOCATIONS.map((item, idx) => (
          <ListItem
            key={idx}
            className={item.className}
            label={item.label}
            value={item.value}
          />
        ))}
      </ul>
      <ul className="mt-8 list-none pl-0">
        {DATA_PROVISIONS.map((item, idx) => (
          <ListItem
            key={idx}
            className={item.className}
            label={item.label}
            value={item.value}
          />
        ))}
      </ul>
      <ul className="mt-8 list-none pl-0">
        {DATA_TOTAL.map((item, idx) => (
          <ListItem
            key={idx}
            className={item.className}
            label={item.label}
            value={item.value}
          />
        ))}
      </ul>
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
    </div>
  )
}

export default DashboardView
