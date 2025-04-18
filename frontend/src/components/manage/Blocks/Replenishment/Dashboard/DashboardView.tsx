'use client'

import React, { useContext } from 'react'

import cx from 'classnames'
import { Link, useLocation, useSearch } from 'wouter'

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

import useGetDashboardData from './useGetDashboardData'

function formatNumber(value: number): null | number | string {
  let result: null | number | string = value

  if (value >= 100000) {
    result = formatNumberValue(value, 0, 0)
  } else if (value <= 0.15 && value >= -0.15) {
    result = 0
  } else {
    result = formatNumberValue(value, 2, 2)
  }

  return result
}

function SummaryCard(props: any) {
  const { elements, label, prefix, suffix, value } = props
  const contents = []

  if (elements) {
    for (let i = 0; i < elements.length; i++) {
      contents.push(
        <div
          key={i}
          className={cx('flex flex-col gap-y-2 uppercase', {
            'flex-1': elements.length === 3,
          })}
        >
          <div className="text-2xl font-bold text-[#4D4D4D]">
            {elements[i].label}
          </div>
          <div className={cx('text-2xl', elements[i].className)}>
            {elements[i].prefix || ''}
            {elements[i].value}
            {elements[i].suffix || ''}
          </div>
        </div>,
      )
    }
  }

  return (
    <div className="flex max-h-52 min-h-52 min-w-[25rem] flex-1 flex-col justify-between rounded-lg bg-[#F5F5F5] p-4 2xl:min-w-[29.33rem] 2xl:max-w-[29.33rem] print:break-inside-avoid">
      <div className="flex items-center justify-between">
        <div className="max-w-0 text-3xl font-bold uppercase text-[#4D4D4D]">
          {label}
        </div>
        <div className="text-3xl leading-normal">
          <span className="font-light">{prefix}</span>
          {value}
          {suffix}
        </div>
      </div>
      <hr className="mb-4 mt-2 block w-full border border-x-0 border-b-0 border-solid border-[#E0E0E0]" />
      <div className="flex justify-between gap-10">{contents}</div>
    </div>
  )
}

function BigCard(props: any) {
  const { elements, label } = props

  const contents = []

  if (elements) {
    for (let i = 0; i < elements.length; i++) {
      contents.push(
        <div key={i} className="my-4 flex flex-col gap-y-2 uppercase">
          <div className="text-2xl font-bold text-[#4D4D4D]">
            {elements[i].label}
          </div>
          <div className="text-2xl">
            <span className="font-light">{elements[i].prefix || ''}</span>
            {elements[i].value}
            {elements[i].suffix || ''}
          </div>
        </div>,
      )
    }
  }

  return (
    <div className="flex flex-col gap-y-4 rounded-lg border border-solid border-primary p-4">
      <div className="max-w-0 text-3xl font-bold uppercase leading-normal text-[#4D4D4D]">
        {label}
      </div>
      <hr className="mt-2 block w-full border border-x-0 border-b-0 border-solid border-[#E0E0E0]" />
      <div className="flex flex-col">{contents}</div>
    </div>
  )
}

function getPercent(tot: number, x: number) {
  return (x * 100) / tot
}

function TabIndicatorsPledged(props: any) {
  const { contrib, period, totals } = props
  return (
    <BigCard
      label="Pledged contributions"
      elements={[
        {
          label: 'amount',
          prefix: '$',
          value: formatNumber(totals.agreed_contributions),
        },
        { label: 'countries', value: contrib.countries },
        {
          label: 'period',
          value: period || `1991-${new Date().getFullYear()}`,
        },
      ]}
    />
  )
}

function TabIndicatorsPayments(props: any) {
  const { contrib, totals } = props
  return (
    <SummaryCard
      label="Cash payments"
      prefix="$"
      value={formatNumber(totals.cash_payments)}
      elements={[
        { label: 'countries', value: contrib.contributions },
        {
          label: 'countries percent',
          suffix: '%',
          value: formatNumber(contrib.contributions_percentage),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(totals.agreed_contributions, totals.cash_payments),
          ),
        },
      ]}
    />
  )
}

function TabIndicatorsBilateralAssistance(props: any) {
  const { contrib, totals } = props
  return (
    <SummaryCard
      label="Bilateral assistance"
      prefix="$"
      value={formatNumber(totals.bilateral_assistance)}
      elements={[
        { label: 'countries', value: contrib.bilateral_assistance_countries },
        {
          label: 'countries percent',
          suffix: '%',
          value: formatNumber(
            contrib.bilateral_assistance_countries_percentage,
          ),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(
              totals.agreed_contributions,
              totals.bilateral_assistance,
            ),
          ),
        },
      ]}
    />
  )
}

function TabIndicatorsPromissoryNotes(props: any) {
  const { contrib, totals } = props
  return (
    <SummaryCard
      label="Promissory notes"
      prefix="$"
      value={formatNumber(totals.promissory_notes)}
      elements={[
        { label: 'countries', value: contrib.promissory_notes_countries },
        {
          label: 'countries percent',
          suffix: '%',
          value: formatNumber(contrib.promissory_notes_countries_percentage),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(totals.agreed_contributions, totals.promissory_notes),
          ),
        },
      ]}
    />
  )
}

function TabIndicatorsOutstandingContributions(props: any) {
  const { contrib, totals } = props

  const value =
    totals?.outstanding_contributions_with_disputed ??
    totals.outstanding_contributions

  return (
    <SummaryCard
      label="Outstanding contributions"
      prefix="$"
      value={formatNumber(value)}
      elements={[
        { label: 'countries', value: contrib.outstanding_contributions },
        {
          label: 'countries percent',
          suffix: '%',
          value: formatNumber(contrib.outstanding_contributions_percentage),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(getPercent(totals.agreed_contributions, value)),
        },
      ]}
    />
  )
}

function TabIndicatorsDisputedContributions(props: any) {
  const { disputed_contributions, totals } = props
  return (
    <SummaryCard
      label="Disputed contributions"
      elements={[
        {
          label: 'amount',
          prefix: '$',
          value: formatNumber(disputed_contributions),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(totals.agreed_contributions, disputed_contributions),
          ),
        },
      ]}
    />
  )
}

function TabIndicatorsFerm(props: any) {
  const { totals } = props
  const absolute_value_gain_loss = Math.abs(totals.gain_loss)

  return (
    <SummaryCard
      label={totals.gain_loss < 0 ? 'FERM gain' : 'FERM loss'}
      elements={[
        {
          className: totals.gain_loss < 0 ? '' : 'text-red-500',
          label: 'amount',
          prefix: '$',
          value: formatNumber(absolute_value_gain_loss),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(totals.agreed_contributions, absolute_value_gain_loss),
          ),
        },
      ]}
    />
  )
}

function TabIndicatorsInterestEarned(props: any) {
  const { contrib, totals } = props
  return (
    <SummaryCard
      label="Interest earned"
      elements={[
        {
          label: 'amount',
          prefix: '$',
          value: formatNumber(totals.interest_earned),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(totals.agreed_contributions, totals.interest_earned),
          ),
        },
      ]}
    />
  )
}

function socRows(data: Record<string, any>, onlyCeits: boolean) {
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

function CummulativeTab(props: any) {
  const { onlyCeits, period } = props
  const { data } = useGetSCData()

  const contrib = extractContributions(socRows(data, onlyCeits))

  const totals = onlyCeits ? data.ceit : data.total

  const disputed_contributions = onlyCeits
    ? data.ceit?.disputed_contributions
    : data.disputed_contributions

  if (totals) {
    return (
      <div className="flex w-full flex-wrap justify-between gap-4 md:flex-nowrap">
        <div className="w-full lg:w-1/2 2xl:w-1/5">
          <TabIndicatorsPledged
            contrib={contrib}
            period={period}
            totals={totals}
          />
        </div>
        <div className="flex w-full flex-wrap gap-4 lg:w-1/2 2xl:w-4/5">
          <TabIndicatorsPayments contrib={contrib} totals={totals} />
          <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
          <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
          <TabIndicatorsOutstandingContributions
            contrib={contrib}
            totals={totals}
          />
          <TabIndicatorsDisputedContributions
            disputed_contributions={disputed_contributions}
            totals={totals}
          />
          <TabIndicatorsFerm contrib={contrib} totals={totals} />
          {onlyCeits ? null : (
            <TabIndicatorsInterestEarned contrib={contrib} totals={totals} />
          )}
        </div>
      </div>
    )
  } else {
    return null
  }
}

function TriennialTab(props: any) {
  const { onlyCeits, period } = props

  const [year_start, year_end] = period.split('-')

  const { data } = useGetSCData(year_start, year_end)

  const contrib = extractContributions(socRows(data, onlyCeits))
  const totals = onlyCeits ? data.ceit : data.total
  const disputed_contributions = onlyCeits
    ? data.ceit?.disputed_contributions
    : data.disputed_contributions

  const curYear = new Date().getFullYear()

  const showOutstandingExplanation = curYear < parseInt(year_end, 10)
  let outstandingExplanation = ''

  if (curYear == parseInt(year_start, 10)) {
    outstandingExplanation = `Only the year ${year_start} is considered.`
  } else if (showOutstandingExplanation) {
    outstandingExplanation = `Only the years ${year_start} - ${curYear} are considered`
  }

  if (totals) {
    return (
      <>
        <div className="flex w-full flex-wrap justify-between gap-4 md:flex-nowrap">
          <div className="w-full lg:w-1/2 2xl:w-1/5">
            <TabIndicatorsPledged
              contrib={contrib}
              period={`${period}*`}
              totals={totals}
            />
          </div>
          <div className="flex w-full flex-wrap gap-4 lg:w-1/2 2xl:w-4/5">
            <TabIndicatorsPayments contrib={contrib} totals={totals} />
            <TabIndicatorsBilateralAssistance
              contrib={contrib}
              totals={totals}
            />
            <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
            <TabIndicatorsOutstandingContributions
              contrib={contrib}
              totals={totals}
            />
            <TabIndicatorsDisputedContributions
              disputed_contributions={disputed_contributions}
              totals={totals}
            />
            <TabIndicatorsFerm contrib={contrib} totals={totals} />
            {onlyCeits ? null : (
              <TabIndicatorsInterestEarned contrib={contrib} totals={totals} />
            )}
          </div>
        </div>

        <div className="w-full 2xl:max-w-[50%]">
          {showOutstandingExplanation ? (
            <p>
              <sup>*</sup> {outstandingExplanation}
            </p>
          ) : null}
        </div>
      </>
    )
  } else {
    return null
  }
}

function getDefaultYear(periodOptions: Record<string, any>[], period?: string) {
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

function getDefaultRange(
  periodOptions: Record<string, any>[],
  period?: string,
) {
  return period || periodOptions[0]?.value
}

function AnnualTab(props: any) {
  const { onlyCeits, period } = props

  const { data } = useGetSCData(period)

  const contrib = extractContributions(socRows(data, onlyCeits))
  const totals = onlyCeits ? data.ceit : data.total
  const disputed_contributions = onlyCeits
    ? data.ceit?.disputed_contributions
    : data.disputed_contributions

  if (totals) {
    return (
      <div className="flex w-full flex-wrap justify-between gap-4 md:flex-nowrap">
        <div className="w-full lg:w-1/2 2xl:w-1/5">
          <TabIndicatorsPledged
            contrib={contrib}
            period={period}
            totals={totals}
          />
        </div>
        <div className="flex w-full flex-wrap gap-4 lg:w-1/2 2xl:w-4/5">
          <TabIndicatorsPayments contrib={contrib} totals={totals} />
          <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
          <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
          <TabIndicatorsOutstandingContributions
            contrib={contrib}
            totals={totals}
          />
          <TabIndicatorsDisputedContributions
            disputed_contributions={disputed_contributions}
            totals={totals}
          />
          <TabIndicatorsFerm contrib={contrib} totals={totals} />
          {onlyCeits ? null : (
            <TabIndicatorsInterestEarned contrib={contrib} totals={totals} />
          )}
        </div>
      </div>
    )
  } else {
    return null
  }
}

interface ITab {
  component: React.ElementType | null
  label: string
  path: string
  showPeriodSelector: boolean
}

const TABS: ITab[] = [
  {
    component: CummulativeTab,
    label: 'Cummulative',
    path: '/cummulative',
    showPeriodSelector: false,
  },
  {
    component: TriennialTab,
    label: 'Triennial',
    path: '/triennial',
    showPeriodSelector: true,
  },
  {
    component: AnnualTab,
    label: 'Annual',
    path: '/annual',
    showPeriodSelector: true,
  },
]

function getTabLinks(
  pathname: string,
  searchParams: string,
): [ITab | null, React.JSX.Element[]] {
  const result = []

  let currentSection: ITab | null = null

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

interface IDashboardViewProps {
  period?: string
  section?: string
}

function DashboardView(props: IDashboardViewProps) {
  const { period, section: tab } = props
  const { newData } = useGetDashboardData()
  const { asOfDate, charts } = newData

  const searchParams = new URLSearchParams(useSearch())
  const onlyCeits = searchParams.has('ceits')

  const [pathname, setLocation] = useLocation()
  const [currentSection, navLinks] = getTabLinks(
    pathname,
    searchParams.toString(),
  )

  const ctx = useContext<any>(ReplenishmentContext)

  let periodOptions: { label: string; value: string }[] = []
  let defaultPeriod

  switch (tab) {
    case 'triennial':
      periodOptions = scPeriodOptions(ctx?.periods)
      defaultPeriod = getDefaultRange(periodOptions, period)
      break
    case 'annual':
      periodOptions = scAnnualOptions(ctx?.periods)
      defaultPeriod = getDefaultYear(periodOptions, period)
      break
    default:
      periodOptions = []
      break
  }

  const Component = currentSection?.component ?? CummulativeTab

  function handleToggleCeits() {
    if (onlyCeits) {
      setLocation(`${pathname}`)
    } else {
      setLocation(`${pathname}?ceits=yes`)
    }
  }

  function handlePeriodChange(newPath: string) {
    if (searchParams.size) {
      setLocation(`${newPath}?${searchParams.toString()}`)
    } else {
      setLocation(newPath)
    }
  }

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-x-3 gap-y-4">
        <h2 className="flex shrink flex-wrap items-center gap-1">
          <span className="whitespace-normal">
            Dashboard as of {asOfDate} (USD)
          </span>
        </h2>
        <div className="flex items-center gap-2 print:hidden">
          <label
            className={cx(
              'flex h-10 cursor-pointer items-center rounded-lg border border-solid border-primary px-2 py-1 text-lg font-bold text-gray-400',
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
        className="mt-8 w-full"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        {(currentSection?.showPeriodSelector && defaultPeriod) ||
        !currentSection?.showPeriodSelector ? (
          <Component period={defaultPeriod} onlyCeits={onlyCeits} />
        ) : null}

        {charts && !onlyCeits ? (
          <div className="">
            <br className="m-5 leading-7" />
            <div className="flex w-[90vw] flex-wrap 2xl:w-full print:flex-col">
              {charts && (
                <>
                  <div className="w-full 2xl:w-1/2 print:w-full print:break-inside-avoid">
                    <h3 className="text-2xl uppercase">
                      Outstanding pledges by triennium
                    </h3>
                    <BarChart
                      title="Outstanding pledges by triennium"
                      data={charts.outstanding_pledges.map((o) => ({
                        ...o,
                        outstanding_pledges: o.outstanding_pledges / 10 ** 6,
                      }))}
                    />
                  </div>
                  <div className="w-full 2xl:w-1/2 print:w-full print:break-inside-avoid">
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
        ) : null}
      </div>
    </>
  )
}

export default DashboardView
