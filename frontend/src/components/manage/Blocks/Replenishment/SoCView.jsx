'use client'

import { useContext } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

const TABS = [
  {
    label: 'Summary',
    path: '/replenishment/status-of-contributions/summary',
  },
  {
    label: 'Triennial',
    path: '/replenishment/status-of-contributions/triennial',
  },
  {
    label: 'Annual',
    path: '/replenishment/status-of-contributions/annual',
  },
]

function getNavLinks(pathname, period) {
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
        href={period != null ? `${entry.path}/${period}` : entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

export default function SoCView(props) {
  const { children } = props

  const pathname = usePathname()
  const period = getPathPeriod(pathname)

  console.log(period)

  const [currentSection, navLinks] = getNavLinks(pathname, period)

  const ctx = useContext(ReplenishmentContext)

  const title = period
    ? `Status of Contribution for ${period}`
    : 'Status of Contribution'

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <h3>{title}</h3>
        {/* Period/Year selector */}
        <div className="flex items-center gap-2">
          {currentSection?.showPeriodSelector ?? true ? (
            <PeriodSelector
              key={currentSection.label}
              period={period}
              periodOptions={[
                ...(currentSection?.extraPeriodOptions ?? []),
                ...ctx.periodOptions,
              ]}
            />
          ) : null}
          {/* Tabs - Summary / Triennial / Annual */}
          <nav className="flex items-center rounded-lg border border-solid border-primary">
            {navLinks}
          </nav>
        </div>
      </div>
      <>{children}</>
    </section>
  )
}

