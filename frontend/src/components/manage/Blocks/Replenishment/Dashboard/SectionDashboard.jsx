import Link from 'next/link'

import BarChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/BarChart'
import FilledAreaChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/FilledAreaChart'
import TwoAreaCharts from '@ors/components/manage/Blocks/Replenishment/Dashboard/TwoAreaCharts'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'

const overviewOrder = ['balance', 'payment_pledge_percentage', 'gain_loss']
const overviewIndicatorsOrder = [
  'advance_contributions',
  'contributions',
  'outstanding_contributions',
]

function SummaryCard(props) {
  const { label, percentage, value } = props
  return (
    <div className="flex min-h-36 flex-1 flex-col justify-between rounded-lg bg-[#F5F5F5] p-4 print:break-inside-avoid">
      <div className="text-xl font-medium uppercase">{label}</div>
      <div className="text-5xl font-bold leading-normal">
        {value}
        {percentage && '%'}
      </div>
    </div>
  )
}

const DashboardIndicators = ({ data }) => {
  return (
    <div className="my-5 flex flex-wrap items-stretch gap-4 text-primary">
      {data &&
        overviewIndicatorsOrder.map((key) => (
          <div
            key={key}
            className="flex flex-1 items-center justify-between gap-4 rounded-lg bg-[#F5F5F5] p-4 print:break-inside-avoid"
          >
            <span className="text-6xl font-bold print:text-4xl">
              {data[key].value}
            </span>
            <span className="text-2xl font-medium print:text-lg">
              {data[key].label}
            </span>
          </div>
        ))}
    </div>
  )
}

function SectionDashboard(props) {
  const { charts, overview, overviewIndicators } = props

  return (
    <>
      <div className="flex items-center gap-4 print:hidden">
        <h2 className="m-0 text-3xl">DASHBOARD</h2>{' '}
        <span className="print:hidden"> | </span>
        <Link
          className="m-0 text-2xl text-primary no-underline"
          href="./dashboard/status"
        >
          STATUS OF THE FUND
        </Link>{' '}
        <span className="print:hidden"> | </span>
        <Link
          className="m-0 text-2xl text-primary no-underline"
          href="./statistics"
        >
          STATISTICS
        </Link>
      </div>
      <div
        className="mt-8"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <div className="print:flex print:flex-col print:gap-4">
          <div className="print:break-inside-avoid">
            <div className="flex flex-wrap items-stretch gap-4">
              {overview &&
                overviewOrder.map((key) => (
                  <SummaryCard
                    key={key}
                    label={overview[key].label}
                    percentage={overview[key].percentage}
                    value={
                      overview[key].value !== null
                        ? formatNumberValue(overview[key].value, 0, 0)
                        : 'N/A'
                    }
                  />
                ))}
            </div>
            <DashboardIndicators data={overviewIndicators} />
          </div>
        </div>

        <div className="">
          <br className="m-5 leading-7" />
          <div className="flex w-full print:flex-col">
            {charts && (
              <>
                <div className="w-1/2 print:w-full print:break-inside-avoid">
                  <h3 className="text-2xl uppercase">
                    Outstanding pledges by triennium
                  </h3>
                  <BarChart
                    data={charts.outstanding_pledges}
                    title="Outstanding pledges by triennium"
                  />
                </div>
                {/* <div className="print:break-inside-avoid"> */}
                {/*   <h3 className="text-2xl uppercase">Pledged Contributions</h3> */}
                {/*   <FilledAreaChart */}
                {/*     data={charts.pledged_contributions} */}
                {/*     title="Pledged Contributions" */}
                {/*   /> */}
                {/* </div> */}
                <div className="w-1/2 print:w-full print:break-inside-avoid">
                  <h3 className="text-2xl uppercase">
                    Pledged Contributions vs. total payments
                  </h3>
                  <TwoAreaCharts
                    data={charts}
                    title="Pledged Contributions vs total payments"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SectionDashboard
