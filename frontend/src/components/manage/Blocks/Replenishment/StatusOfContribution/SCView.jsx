'use client'

import { useContext } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import SCAnnual from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCAnnual'
import SCSummary from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCSummary'
import SCTriennial from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCTriennial'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

const TABS = [
  {
    component: SCSummary,
    label: 'Summary',
    path: '/replenishment/status-of-contributions/summary',
  },
  {
    component: SCTriennial,
    label: 'Triennial',
    path: '/replenishment/status-of-contributions/triennial',
  },
  {
    component: SCAnnual,
    label: 'Annual',
    path: '/replenishment/status-of-contributions/annual',
  },
]

function getTabLinks(pathname, period) {
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
          'inline-block rounded-t px-2 py-1 text-lg font-bold uppercase leading-10 text-gray-400 hover:bg-primary hover:text-mlfs-hlYellow',
        )}
        href={entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

export default function SCView(props) {
  const pathname = usePathname()
  const period = props.year || props.period

  const [currentSection, navLinks] = getTabLinks(pathname)

  const ctx = useContext(ReplenishmentContext)

  const dateOfLastUpdate = '26 September 2023'
  const title = period
    ? `Status of Contribution for ${period}`
    : 'Status of Contribution'

  const Component = currentSection?.component ?? SCSummary

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2>
          {title}
          <span className="text-2xl font-normal">
            {' '}
            as of {dateOfLastUpdate} (US Dollars)
          </span>
        </h2>
        {/* Period/Year selector */}
        <div className="flex items-center gap-2">
          {/*{currentSection?.showPeriodSelector ?? true ? (*/}
          {/*  <PeriodSelector*/}
          {/*    key={currentSection.label}*/}
          {/*    period={period}*/}
          {/*    periodOptions={[*/}
          {/*      ...(currentSection?.extraPeriodOptions ?? []),*/}
          {/*      ...ctx.periodOptions,*/}
          {/*    ]}*/}
          {/*  />*/}
          {/*) : null}*/}
          {/* Tabs - Summary / Triennial / Annual */}
          <nav className="flex items-center rounded-lg border border-solid border-primary">
            {navLinks}
          </nav>
        </div>
      </div>
      <Component {...props} />
    </section>
  )
}
