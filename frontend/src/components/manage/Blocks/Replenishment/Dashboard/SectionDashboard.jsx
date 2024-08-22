'use client'

import { useContext, useState } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import BarChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/BarChart'
import FilledAreaChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/FilledAreaChart'
import TwoAreaCharts from '@ors/components/manage/Blocks/Replenishment/Dashboard/TwoAreaCharts'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import useGetSCData from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/useGetSCData'
import {
  scAnnualOptions,
  scPeriodOptions,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import { extractContributions } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import { formatNumberValue } from '@ors/components/manage/Blocks/Replenishment/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

const overviewOrder = ['balance', 'payment_pledge_percentage', 'gain_loss']
const overviewIndicatorsOrder = [
  'advance_contributions',
  'contributions',
  'outstanding_contributions',
]

function SummaryCard(props) {
  const { label, percentage, subLabel, value } = props
  return (
    <div className="flex min-h-36 flex-1 flex-col justify-between rounded-lg bg-[#F5F5F5] p-4 print:break-inside-avoid">
      <div className="text-xl font-medium uppercase">{label}</div>
      <div className="text-base uppercase">{subLabel}</div>
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

function getPercent(tot, x) {
  return (x * 100) / tot
}

function TabIndicatorsPayments(props) {
  const { contrib, data, scData } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Pledged contributions"
        value={formatNumberValue(scData.total.agreed_contributions, 2, 2)}
      />
      <SummaryCard
        label="Cash payments"
        subLabel="countries"
        value={contrib.contributions}
      />
      <SummaryCard
        label="Cash payments"
        subLabel="amount"
        value={formatNumberValue(scData.total.cash_payments, 2, 2)}
      />
      <SummaryCard
        label="Cash payments"
        percentage={true}
        subLabel="percentage"
        value={formatNumberValue(
          getPercent(
            scData.total.agreed_contributions,
            scData.total.cash_payments,
          ),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsBilateralAssistance(props) {
  const { contrib, data, scData } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Bilateral assistance"
        subLabel="countries"
        value={contrib.bilateral_assistance_countries}
      />
      <SummaryCard
        label="Bilateral assistance"
        subLabel="amount"
        value={formatNumberValue(scData.total.bilateral_assistance, 2, 2)}
      />
      <SummaryCard
        label="Bilateral assistance"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(
            scData.total.agreed_contributions,
            scData.total.bilateral_assistance,
          ),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsPromissoryNotes(props) {
  const { contrib, data, scData } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Promissory notes"
        subLabel="countries"
        value={contrib.promissory_notes_countries}
      />
      <SummaryCard
        label="Promissory notes"
        subLabel="amount"
        value={formatNumberValue(scData.total.promissory_notes, 2, 2)}
      />
      <SummaryCard
        label="Promissory notes"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(
            scData.total.agreed_contributions,
            scData.total.promissory_notes,
          ),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsOutstandingContributions(props) {
  const { contrib, data, scData } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Outstanding contributions"
        subLabel="countries"
        value={contrib.outstanding_contributions}
      />
      <SummaryCard
        label="Outstanding contributions"
        subLabel="amount (excl. disputed)"
        value={formatNumberValue(scData.total.outstanding_contributions, 2, 2)}
      />
      <SummaryCard
        label="Outstanding contributions"
        percentage={true}
        subLabel="percentage out of pledged (excl.disputed)"
        value={formatNumberValue(
          getPercent(
            scData.total.agreed_contributions,
            scData.total.outstanding_contributions,
          ),
          2,
          2,
        )}
      />
      <SummaryCard
        label="Outstanding contributions"
        subLabel="amount (incl. disputed)"
        value={formatNumberValue(
          scData.total.outstanding_contributions_with_disputed,
          2,
          2,
        )}
      />
      <SummaryCard
        label="Outstanding contributions"
        percentage={true}
        subLabel="percentage out of pledged (incl.disputed)"
        value={formatNumberValue(
          getPercent(
            scData.total.agreed_contributions,
            scData.total.outstanding_contributions_with_disputed,
          ),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsDisputedContributions(props) {
  const { contrib, data, scData } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Disputed contributions"
        subLabel="amount"
        value={formatNumberValue(scData.disputed_contributions, 2, 2)}
      />
      <SummaryCard
        label="Disputed contributions"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(
            scData.total.agreed_contributions,
            scData.disputed_contributions,
          ),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsFerm(props) {
  const { contrib, data, scData } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label={scData.total.gain_loss < 0 ? 'FERM gain' : 'FERM loss'}
        subLabel="amount"
        value={formatNumberValue(scData.total.gain_loss, 2, 2)}
      />
      <SummaryCard
        label={scData.total.gain_loss < 0 ? 'FERM gain' : 'FERM loss'}
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(scData.total.agreed_contributions, scData.total.gain_loss),
          2,
          2,
        )}
      />
    </div>
  )
}

function CummulativeTab(props) {
  const { data } = props
  const { data: scData } = useGetSCData()

  const contrib = extractContributions(scData?.status_of_contributions ?? [])

  if (scData.total) {
    return (
      <div className="flex flex-col gap-4">
        <TabIndicatorsPayments contrib={contrib} data={data} scData={scData} />
        <TabIndicatorsBilateralAssistance
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsPromissoryNotes
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsOutstandingContributions
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsDisputedContributions
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsFerm contrib={contrib} data={data} scData={scData} />
      </div>
    )
  } else {
    return null
  }
}

function TriennialTab(props) {
  const { data, period, periodOptions } = props

  const [year_start, year_end] = period
    ? period.split('-')
    : periodOptions[0]?.value.split('-')

  const { data: scData } = useGetSCData(year_start, year_end)

  const contrib = extractContributions(scData?.status_of_contributions ?? [])

  if (scData.total) {
    return (
      <div className="flex flex-col gap-4">
        <TabIndicatorsPayments contrib={contrib} data={data} scData={scData} />
        <TabIndicatorsBilateralAssistance
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsPromissoryNotes
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsOutstandingContributions
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsDisputedContributions
          contrib={contrib}
          data={data}
          scData={scData}
        />
      </div>
    )
  } else {
    return null
  }
}

function getDefaultYear(periodOptions, period) {
  let result = period
  if (!period) {
    let year = parseInt(periodOptions[0]?.value, 10)
    const curYear = new Date().getFullYear()

    if (year > curYear) {
      year = curYear
    }

    result = `${year}`
  }
  return result
}

function getDefaultRange(periodOptions, period) {
  return period || periodOptions[0]?.value
}

function AnnualTab(props) {
  const { data, period, periodOptions } = props

  const year = getDefaultYear(periodOptions, period)

  const { data: scData } = useGetSCData(year)

  const contrib = extractContributions(scData?.status_of_contributions ?? [])

  if (scData.total) {
    return (
      <div className="flex flex-col gap-4">
        <TabIndicatorsPayments contrib={contrib} data={data} scData={scData} />
        <TabIndicatorsBilateralAssistance
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsPromissoryNotes
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsOutstandingContributions
          contrib={contrib}
          data={data}
          scData={scData}
        />
        <TabIndicatorsDisputedContributions
          contrib={contrib}
          data={data}
          scData={scData}
        />
      </div>
    )
  } else {
    return null
  }
}

const TABS = [
  {
    component: CummulativeTab,
    label: 'Cummulative',
    path: '/replenishment/dashboard/cummulative',
    showPeriodSelector: false,
  },
  {
    component: TriennialTab,
    label: 'Triennial',
    path: '/replenishment/dashboard/triennial',
    showPeriodSelector: true,
  },
  {
    component: AnnualTab,
    label: 'Annual',
    path: '/replenishment/dashboard/annual',
    showPeriodSelector: true,
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
  const { charts, data, overview, overviewIndicators, period, tab } = props

  const pathname = usePathname()
  const [currentSection, navLinks] = getTabLinks(pathname)

  const ctx = useContext(ReplenishmentContext)

  let periodOptions = []
  let defaultPeriod

  switch (tab) {
    case 'triennial':
      periodOptions = scPeriodOptions(ctx.periods)
      defaultPeriod = getDefaultRange(periodOptions, period)
      break
    case 'annual':
      periodOptions = scAnnualOptions(ctx.periods)
      defaultPeriod = getDefaultYear(periodOptions, period)
      break
    default:
      periodOptions = []
      break
  }

  const Component = currentSection?.component ?? CummulativeTab

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
          {currentSection?.showPeriodSelector ? (
            <PeriodSelector
              key={currentSection.label}
              label=""
              period={period}
              periodOptions={periodOptions}
              selectedPeriod={defaultPeriod}
            />
          ) : null}
          <nav className="flex items-center rounded-lg border border-solid border-primary">
            {navLinks}
          </nav>
        </div>
      </div>

      <div
        className="mt-8"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        <Component
          data={data}
          period={defaultPeriod}
          periodOptions={periodOptions}
        />

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
