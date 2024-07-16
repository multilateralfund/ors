import cx from 'classnames'

const PRINT_CLASS = 'print:w-full print:min-w-full print:max-w-full print:border-none print:p-0 print:gap-3 print:justify-start'

function IndicatorBox({ isPercentage, text, value }) {
  return (
    <div
      className={cx(
        'flex min-w-80 max-w-96 flex-1 items-center justify-center gap-5 rounded-lg border-2 border-solid border-gray-200 p-4 uppercase text-primary',
        PRINT_CLASS,
      )}
    >
      <span className="text-6xl font-bold print:text-4xl">
        {value}
        {isPercentage && '%'}
      </span>
      <span className="text-2xl font-medium print:text-lg">{text}</span>
    </div>
  )
}

const SummaryIndicators = ({ data }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-primary text-primary">
      <IndicatorBox
        text="Parties have made their contributions in advance"
        value={data.contributions_advance}
      />
      <IndicatorBox
        text="parties have made their contributions"
        value={data.contributions}
      />
      <IndicatorBox
        text="parties have outstanding contributions"
        value={data.outstanding_contributions}
      />
    </div>
  )
}

const TriennialIndicators = ({ data, period, totalPledge }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-primary text-primary">
      <IndicatorBox
        text={`parties have made their contributions for ${period}`}
        value={data.contributions}
      />
      <IndicatorBox
        text={`of the total pledge received for ${period}`}
        value={totalPledge}
        isPercentage
      />
    </div>
  )
}

const AnnualIndicators = ({ data, totalPledge, year }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-primary text-primary">
      <IndicatorBox
        text={`parties have made their contributions for ${year}`}
        value={data.contributions}
      />
      <IndicatorBox
        text={`of the total pledge received for ${year}`}
        value={totalPledge}
        isPercentage
      />
    </div>
  )
}

export { AnnualIndicators, SummaryIndicators, TriennialIndicators }
