import cx from 'classnames'

import { formatNumberValue } from '../utils'
import {
  AnnualContributions,
  Contributions,
  SummaryContributions,
  TriennialContributions,
} from './types'

const PRINT_CLASS =
  'print:w-full print:min-w-full print:max-w-full print:border-none print:p-0 print:gap-3 print:justify-start'

interface IndicatorBoxProps {
  classes?: string
  isPercentage?: boolean
  subtext?: string
  text: string
  value?: null | number | string
}

function IndicatorBox(props: IndicatorBoxProps) {
  const { classes, isPercentage, subtext, text, value } = props
  return (
    <div
      className={cx(
        'flex min-w-80 max-w-96 flex-1 items-center justify-center gap-5 rounded-lg border-2 border-solid border-gray-200 p-4 uppercase text-primary',
        PRINT_CLASS,
        classes,
      )}
    >
      <span className="text-6xl font-bold print:text-4xl">
        {value}
        {isPercentage && '%'}
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-medium print:text-lg">{text}</span>
        {subtext ? <span className="font-medium">{subtext}</span> : null}
      </div>
    </div>
  )
}

const SummaryIndicators = ({ data }: { data: SummaryContributions }) => {
  return (
    <div className="flex flex-wrap items-stretch justify-start gap-4 border-primary text-primary">
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
      <IndicatorBox
        isPercentage={true}
        text="paid out of the total pledged"
        value={
          data.percentage_total_paid_current_year
            ? formatNumberValue(data.percentage_total_paid_current_year, 0, 0)
            : null
        }
      />
    </div>
  )
}

const TriennialIndicators = ({
  data,
  period,
  totalPledge,
}: {
  data: TriennialContributions
  period: string
  totalPledge: string
}) => {
  return (
    <div className="flex flex-wrap items-stretch justify-start gap-4 border-primary text-primary">
      <IndicatorBox
        text={`parties have made their contributions for ${period}`}
        value={data.contributions}
      />
      <IndicatorBox
        text={`of the total pledged received for ${period}`}
        value={totalPledge}
        isPercentage
      />
    </div>
  )
}

const AnnualIndicators = ({
  data,
  totalPledge,
  year,
}: {
  data: AnnualContributions
  totalPledge: string
  year: string
}) => {
  return (
    <div className="flex flex-wrap items-stretch justify-start gap-4 border-primary text-primary">
      <IndicatorBox
        text={`parties have made their contributions for ${year}`}
        value={data.contributions}
      />
      <IndicatorBox
        text={`of the total pledged received for ${year}`}
        value={totalPledge}
        isPercentage
      />
    </div>
  )
}

export {
  AnnualIndicators,
  IndicatorBox,
  SummaryIndicators,
  TriennialIndicators,
}
