'use client'

import { useContext, useState } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import BarChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/BarChart'
import FilledAreaChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/FilledAreaChart'
import TwoAreaCharts from '@ors/components/manage/Blocks/Replenishment/Dashboard/TwoAreaCharts'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import {
  scAnnualOptions,
  scPeriodOptions,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

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
            <span className="text-2xl font-medium uppercase print:text-lg">
              {data[key].label}
            </span>
          </div>
        ))}
    </div>
  )
}

const TABS = [
  {
    component: <div>Cummulative</div>,
    label: 'Cummulative',
    path: '/replenishment/dashboard/cummulative',
    showPeriodSelector: false,
  },
  {
    component: <div>Triennial</div>,
    label: 'Triennial',
    path: '/replenishment/dashboard/triennial',
  },
  {
    component: <div>Annual</div>,
    label: 'Annual',
    path: '/replenishment/dashboard/annual',
  },
]

function getTabLinks(pathname) {
  const result = []

  let currentSection

  for (let i = 0; i < TABS.length; i++) {
    const entry = TABS[i]
    const isCurrent = pathname.startsWith(entry.path)
    if (isCurrent) {
      currentSection = TABS[i]
    }
    result.push(
      <Link
        key={i}
        className={cx(
          { 'bg-primary text-mlfs-hlYellow': isCurrent },
          'inline-flex h-10 min-w-24 items-center justify-center border-0 px-2 py-1 text-lg font-bold uppercase leading-10 text-gray-400 no-underline hover:bg-primary hover:text-mlfs-hlYellow',
          {
            'rounded-l-lg border-r border-solid border-primary': i === 0,
            'rounded-r-lg border-l border-solid border-primary':
              i === TABS.length - 1,
          },
        )}
        href={entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

function SectionDashboard(props) {
  const { charts, overview, overviewIndicators, period, tab } = props

  const pathname = usePathname()
  const [currentSection, navLinks] = getTabLinks(pathname)

  const ctx = useContext(ReplenishmentContext)

  let periodOptions = []
  switch (tab) {
    case 'triennial':
      periodOptions = scPeriodOptions(ctx.periods)
      break
    case 'annual':
      periodOptions = scAnnualOptions(ctx.periods)
      break
    default:
      periodOptions = []
      break
  }

  const Component = currentSection?.component ?? <div>cummulative</div>

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 print:hidden">
          <h2 className="m-0 text-3xl">DASHBOARD</h2>{' '}
          <span className="print:hidden"> | </span>
          <Link
            className="m-0 text-2xl text-primary no-underline"
            href="/replenishment/dashboard/status"
          >
            STATUS OF THE FUND
          </Link>{' '}
          <span className="print:hidden"> | </span>
          <Link
            className="m-0 text-2xl text-primary no-underline"
            href="/replenishment/dashboard/statistics"
          >
            STATISTICS
          </Link>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {currentSection?.showPeriodSelector ?? true ? (
            <PeriodSelector
              key={currentSection.label}
              label=""
              period={period}
              periodOptions={periodOptions}
            />
          ) : null}
          <nav className="flex items-center rounded-lg border border-solid border-primary">
            {navLinks}
          </nav>
        </div>
      </div>

      <div>{Component}</div>

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
