'use client'

import type { IDashboardDataApiResponse } from './useGetDashboardDataTypes'

import { useContext } from 'react'

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
        <div key={i} className="flex flex-col gap-y-2 uppercase">
          <div className="text-[#4D4D4D]">{elements[i].label}</div>
          <div
            className={cx(
              'text-4xl font-bold text-primary',
              elements[i].className,
            )}
          >
            {elements[i].prefix || ''}
            {elements[i].value}
            {elements[i].suffix || ''}
          </div>
        </div>,
      )
    }
  }

  return (
    <div className="flex max-h-48 min-h-48 min-w-[29.33rem] max-w-[29.33rem] flex-1 flex-col justify-between rounded-lg bg-[#F5F5F5] p-4 print:break-inside-avoid">
      <div className="flex items-center justify-between">
        <div className="max-w-0 text-xl font-medium uppercase text-[#4D4D4D]">
          {label}
        </div>
        <div className="text-5xl font-bold leading-normal text-primary">
          <span className="font-normal">{prefix}</span>
          {value}
          {suffix}
        </div>
      </div>
      <hr className="mb-4 mt-2 block w-full border border-x-0 border-b-0 border-solid border-[#E0E0E0]" />
      <div className="flex justify-between">{contents}</div>
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
          <div className="text-[#4D4D4D]">{elements[i].label}</div>
          <div className="text-4xl font-bold text-primary">
            <span className="font-normal">{elements[i].prefix || ''}</span>
            {elements[i].value}
            {elements[i].suffix || ''}
          </div>
        </div>,
      )
    }
  }

  return (
    <div className="flex flex-col gap-y-4 rounded-lg border border-solid border-primary p-4">
      <div className="max-w-0 text-xl font-medium uppercase leading-normal text-[#4D4D4D]">
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
  const { data } = props
  return (
    <SummaryCard
      label="Disputed contributions"
      elements={[
        {
          label: 'amount',
          prefix: '$',
          value: formatNumber(data.disputed_contributions),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(
              data.total.agreed_contributions,
              data.disputed_contributions,
            ),
          ),
        },
      ]}
    />
  )
}

function TabIndicatorsFerm(props: any) {
  const { totals } = props
  return (
    <SummaryCard
      label={totals.gain_loss < 0 ? 'FERM gain' : 'FERM loss'}
      elements={[
        {
          className: totals.gain_loss < 0 ? '' : 'text-red-500',
          label: 'amount',
          prefix: totals.gain_loss < 0 ? '+$' : '-$',
          value: formatNumber(totals.gain_loss),
        },
        {
          label: 'percentage of pledged',
          suffix: '%',
          value: formatNumber(
            getPercent(totals.agreed_contributions, totals.gain_loss),
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

  if (totals) {
    return (
      <div className="flex w-full justify-between gap-4">
        <div className="w-1/5">
          <TabIndicatorsPledged
            contrib={contrib}
            period={period}
            totals={totals}
          />
        </div>
        <div className="flex w-4/5 flex-wrap gap-4">
          <TabIndicatorsPayments contrib={contrib} totals={totals} />
          <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
          <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
          <TabIndicatorsOutstandingContributions
            contrib={contrib}
            totals={totals}
          />
          {onlyCeits ? null : (
            <TabIndicatorsDisputedContributions data={data} />
          )}
          {onlyCeits ? null : (
            <TabIndicatorsFerm contrib={contrib} totals={totals} />
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
        <div className="flex w-full justify-between gap-4">
          <div className="w-1/5">
            <TabIndicatorsPledged
              contrib={contrib}
              period={`${period}*`}
              totals={totals}
            />
          </div>
          <div className="flex w-4/5 flex-wrap gap-4">
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
            {onlyCeits ? null : (
              <TabIndicatorsDisputedContributions data={data} />
            )}
          </div>
        </div>

        <div className="w-full lg:max-w-[50%]">
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

function getDefaultYear(periodOptions: Record<string, any>[], period: string) {
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

function getDefaultRange(periodOptions: Record<string, any>[], period: string) {
  return period || periodOptions[0]?.value
}

function AnnualTab(props: any) {
  const { onlyCeits, period } = props

  const { data } = useGetSCData(period)

  const contrib = extractContributions(socRows(data, onlyCeits))
  const totals = onlyCeits ? data.ceit : data.total

  if (totals) {
    return (
      <div className="flex w-full justify-between gap-4">
        <div className="w-1/5">
          <TabIndicatorsPledged
            contrib={contrib}
            period={period}
            totals={totals}
          />
        </div>
        <div className="flex w-4/5 flex-wrap gap-4">
          <TabIndicatorsPayments contrib={contrib} totals={totals} />
          <TabIndicatorsBilateralAssistance contrib={contrib} totals={totals} />
          <TabIndicatorsPromissoryNotes contrib={contrib} totals={totals} />
          <TabIndicatorsOutstandingContributions
            contrib={contrib}
            totals={totals}
          />
          {onlyCeits ? null : (
            <TabIndicatorsDisputedContributions data={data} />
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

function getTabLinks(
  pathname: string,
  searchParams: string,
): [ITab | null, JSX.Element[]] {
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

interface SectionDashboardProps {
  charts: IDashboardDataApiResponse['charts']
  period: string
  tab: string
}
function SectionDashboard(props: SectionDashboardProps) {
  const { charts, period, tab } = props

  const searchParams = useSearchParams()
  const onlyCeits = searchParams.has('ceits')

  const pathname = usePathname()
  const [currentSection, navLinks] = getTabLinks(
    pathname,
    searchParams.toString(),
  )

  const router = useRouter()

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
      router.push(`${pathname}`)
    } else {
      router.push(`${pathname}?ceits=yes`)
    }
  }

  function handlePeriodChange(newPath: string) {
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
              'flex cursor-pointer items-center rounded-lg border border-solid border-primary px-2 py-1 font-bold text-gray-400',
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
                    title="Outstanding pledges by triennium"
                    data={charts.outstanding_pledges.map((o) => ({
                      ...o,
                      outstanding_pledges: o.outstanding_pledges / 10 ** 6,
                    }))}
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