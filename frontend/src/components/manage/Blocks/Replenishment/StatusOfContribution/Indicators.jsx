import React from 'react'

function IndicatorBox({ isPercentage, text, value }) {
  return (
    <div className="flex min-w-80 max-w-96 flex-1 items-center justify-center gap-5 rounded-lg border-2 border-solid border-gray-200 p-4 uppercase text-primary">
      <span className="text-6xl font-bold">
        {value}
        {isPercentage && '%'}
      </span>
      <span className="text-2xl font-medium">{text}</span>
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

const TriennialIndicators = ({ data, totalPledge }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-primary text-primary">
      <IndicatorBox
        text="parties have made their contributions"
        value={data.contributions}
      />
      <IndicatorBox
        text="of the total pledge received for the triennial"
        value={totalPledge}
        isPercentage
      />
    </div>
  )
}

export { SummaryIndicators, TriennialIndicators }
