'use client'

import { useContext } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import DisputedContributionDialog from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/DisputedContributionDialog'
import SCAnnual from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCAnnual'
import SCNotes from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCNotes'
import SCSummary from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCSummary'
import SCTriennial from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCTriennial'
import {
  mockSCPeriodOptions,
  mockScAnnualOptions,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

const TABS = [
  {
    component: SCSummary,
    label: 'Summary',
    path: '/replenishment/status-of-contributions/summary',
    showPeriodSelector: false,
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

export default function SCView(props) {
  const pathname = usePathname()
  const period = props.year || props.period

  const [currentSection, navLinks] = getTabLinks(pathname)

  const ctx = useContext(ReplenishmentContext)

  const periodOptions = props.period
    ? mockSCPeriodOptions(ctx.periods)
    : mockScAnnualOptions()

  const dateOfLastUpdate = '26 September 2023'
  const title = period
    ? `Status of Contribution for ${period}`
    : 'Status of Contribution'

  const Component = currentSection?.component ?? SCSummary

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2>
          {title}{' '}
          <span className="text-2xl font-normal">
            as of {dateOfLastUpdate} (US Dollars)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {currentSection?.showPeriodSelector ?? true ? (
            <PeriodSelector
              key={currentSection.label}
              label=""
              period={period}
              periodOptions={[
                ...(currentSection?.extraPeriodOptions ?? []),
                ...periodOptions,
              ]}
            />
          ) : null}
          <nav className="flex items-center rounded-lg border border-solid border-primary">
            {navLinks}
          </nav>
        </div>
      </div>
      <Component {...props} />
      <DisputedContributionDialog />
      <SCNotes type={currentSection?.label.toLowerCase()} />
    </section>
  )
}
