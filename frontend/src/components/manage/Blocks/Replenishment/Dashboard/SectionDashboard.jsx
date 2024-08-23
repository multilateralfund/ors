'use client'

import { useContext, useState } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import BarChart from '@ors/components/manage/Blocks/Replenishment/Dashboard/BarChart'
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

function getPercent(tot, x) {
  return (x * 100) / tot
}

function TabIndicatorsPayments(props) {
  const { contrib, totals } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Pledged contributions"
        value={formatNumberValue(totals.agreed_contributions, 2, 2)}
      />
      <SummaryCard
        label="Cash payments"
        subLabel="countries"
        value={contrib.contributions}
      />
      <SummaryCard
        label="Cash payments"
        percentage={true}
        subLabel="% countries"
        value={formatNumberValue(contrib.contributions_percentage, 2, 2)}
      />
      <SummaryCard
        label="Cash payments"
        subLabel="amount"
        value={formatNumberValue(totals.cash_payments, 2, 2)}
      />
      <SummaryCard
        label="Cash payments"
        percentage={true}
        subLabel="percentage"
        value={formatNumberValue(
          getPercent(totals.agreed_contributions, totals.cash_payments),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsBilateralAssistance(props) {
  const { contrib, totals } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Bilateral assistance"
        subLabel="countries"
        value={contrib.bilateral_assistance_countries}
      />
      <SummaryCard
        label="Bilateral assistance"
        percentage={true}
        subLabel="% countries"
        value={formatNumberValue(
          contrib.bilateral_assistance_countries_percentage,
          2,
          2,
        )}
      />
      <SummaryCard
        label="Bilateral assistance"
        subLabel="amount"
        value={formatNumberValue(totals.bilateral_assistance, 2, 2)}
      />
      <SummaryCard
        label="Bilateral assistance"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(totals.agreed_contributions, totals.bilateral_assistance),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsPromissoryNotes(props) {
  const { contrib, totals } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Promissory notes"
        subLabel="countries"
        value={contrib.promissory_notes_countries}
      />
      <SummaryCard
        label="Promissory notes"
        percentage={true}
        subLabel="% countries"
        value={formatNumberValue(
          contrib.promissory_notes_countries_percentage,
          2,
          2,
        )}
      />
      <SummaryCard
        label="Promissory notes"
        subLabel="amount"
        value={formatNumberValue(totals.promissory_notes, 2, 2)}
      />
      <SummaryCard
        label="Promissory notes"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(totals.agreed_contributions, totals.promissory_notes),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsOutstandingContributions(props) {
  const { contrib, totals } = props

  const value =
    totals?.outstanding_contributions_with_disputed ??
    totals.outstanding_contributions

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Outstanding contributions"
        subLabel="countries"
        value={contrib.outstanding_contributions}
      />
      <SummaryCard
        label="Outstanding contributions"
        percentage={true}
        subLabel="% countries"
        value={formatNumberValue(
          contrib.outstanding_contributions_percentage,
          2,
          2,
        )}
      />
      <SummaryCard
        label="Outstanding contributions"
        subLabel="amount"
        value={formatNumberValue(value, 2, 2)}
      />
      <SummaryCard
        label="Outstanding contributions"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(totals.agreed_contributions, value),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsDisputedContributions(props) {
  const { data } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label="Disputed contributions"
        subLabel="amount"
        value={formatNumberValue(data.disputed_contributions, 2, 2)}
      />
      <SummaryCard
        label="Disputed contributions"
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(
            data.total.agreed_contributions,
            data.disputed_contributions,
          ),
          2,
          2,
        )}
      />
    </div>
  )
}

function TabIndicatorsFerm(props) {
  const { totals } = props
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <SummaryCard
        label={totals.gain_loss < 0 ? 'FERM gain' : 'FERM loss'}
        subLabel="amount"
        value={formatNumberValue(totals.gain_loss, 2, 2)}
      />
      <SummaryCard
        label={totals.gain_loss < 0 ? 'FERM gain' : 'FERM loss'}
        percentage={true}
        subLabel="percentage out of pledged"
        value={formatNumberValue(
          getPercent(totals.agreed_contributions, totals.gain_loss),
          2,
          2,
        )}
      />
    </div>
  )
}

function socRows(data, onlyCeits) {
  let rows = []

  if (onlyCeits) {
    const soc = data?.status_of_contributions ?? []

    const ceits = data?.ceit_countries ?? []
    const ceitIds = []

    for (let i = 0; i < ceits.length; i++) {
      ceitIds.push(ceits[i].id)
    }

    for (let i = 0; i < soc.length; i++) {
      if (ceitIds.includes(soc[i].country.id)) {
        rows.push(soc[i])
      }
    }
  } else {
    rows = data?.status_of_contributions ?? []
  }

  return rows
}

function CummulativeTab(props) {
  const { onlyCeits } = props
  const { data } = useGetSCData()

  const contrib = extractContributions(socRows(data, onlyCeits))

  const totals = onlyCeits ? data.ceit : data.total

  if (totals) {
    return (
      <div className="flex flex-col gap-4">
        <TabIndicatorsPayments contrib={contrib} totals={totals} />
        <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
        <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
        <TabIndicatorsOutstandingContributions
          contrib={contrib}
          totals={totals}
        />
        {onlyCeits ? null : <TabIndicatorsDisputedContributions data={data} />}
        {onlyCeits ? null : (
          <TabIndicatorsFerm contrib={contrib} totals={totals} />
        )}
      </div>
    )
  } else {
    return null
  }
}

function TriennialTab(props) {
  const { onlyCeits, period } = props

  const [year_start, year_end] = period.split('-')

  const { data } = useGetSCData(year_start, year_end)

  const contrib = extractContributions(socRows(data, onlyCeits))
  const totals = onlyCeits ? data.ceit : data.total

  if (totals) {
    return (
      <div className="flex flex-col gap-4">
        <TabIndicatorsPayments contrib={contrib} totals={totals} />
        <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
        <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
        <TabIndicatorsOutstandingContributions
          contrib={contrib}
          totals={totals}
        />
        {onlyCeits ? null : <TabIndicatorsDisputedContributions data={data} />}
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
  const { onlyCeits, period } = props

  const { data } = useGetSCData(period)

  const contrib = extractContributions(socRows(data, onlyCeits))
  const totals = onlyCeits ? data.ceit : data.total

  if (totals) {
    return (
      <div className="flex flex-col gap-4">
        <TabIndicatorsPayments contrib={contrib} totals={totals} />
        <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
        <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
        <TabIndicatorsOutstandingContributions
          contrib={contrib}
          totals={totals}
        />
        {onlyCeits ? null : <TabIndicatorsDisputedContributions data={data} />}
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

function getTabLinks(pathname, searchParams) {
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
        href={searchParams ? `${entry.path}?${searchParams}` : entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

function SectionDashboard(props) {
  const { charts, period, tab } = props

  const searchParams = useSearchParams()
  const onlyCeits = searchParams.has('ceits')

  const pathname = usePathname()
  const [currentSection, navLinks] = getTabLinks(
    pathname,
    searchParams.toString(),
  )

  const router = useRouter()

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

  function handleToggleCeits() {
    if (onlyCeits) {
      router.push(`${pathname}`)
    } else {
      router.push(`${pathname}?ceits=yes`)
    }
  }

  function handlePeriodChange(newPath) {
    if (searchParams.size) {
      router.push(`${newPath}?${searchParams.toString()}`)
    } else {
      router.push(newPath)
    }
  }

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
          <label
            className={cx(
              'flex cursor-pointer items-center rounded-lg border border-solid border-primary px-2 py-1',
              { 'bg-primary font-bold text-mlfs-hlYellow': onlyCeits },
            )}
          >
            <input
              className="collapse hidden"
              checked={onlyCeits}
              type="checkbox"
              onChange={handleToggleCeits}
            />
            <span className="text-nowrap">Only CEITs</span>
          </label>
          {currentSection?.showPeriodSelector ? (
            <PeriodSelector
              key={currentSection.label}
              label=""
              period={period}
              periodOptions={periodOptions}
              selectedPeriod={defaultPeriod}
              onChange={handlePeriodChange}
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
        {(currentSection?.showPeriodSelector && defaultPeriod) ||
        !currentSection?.showPeriodSelector ? (
          <Component period={defaultPeriod} onlyCeits={onlyCeits} />
        ) : null}

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
