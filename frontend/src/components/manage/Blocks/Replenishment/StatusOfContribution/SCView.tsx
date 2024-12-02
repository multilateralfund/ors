'use client'

import React, { useContext } from 'react'

import cx from 'classnames'
import { Link, useLocation } from 'wouter'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import SCAnnual from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCAnnual'
import SCSummary from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCSummary'
import SCTriennial from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCTriennial'
import {
  scAnnualOptions,
  scPeriodOptions,
} from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/utils'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

import { SCViewProps } from './types'

interface Tab {
  component: React.FC<any>
  label: string
  path: string
  showPeriodSelector?: boolean
}

const TABS: Tab[] = [
  {
    component: SCSummary,
    label: 'Summary',
    path: '/summary',
    showPeriodSelector: false,
  },
  {
    component: SCTriennial,
    label: 'Triennial',
    path: '/triennial',
  },
  {
    component: SCAnnual,
    label: 'Annual',
    path: '/annual',
  },
]

function getTabLinks(pathname: string): [Tab | undefined, React.JSX.Element[]] {
  const result = []

  let currentSection: Tab | undefined

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

function SCView(props: SCViewProps) {
  const [ pathname ] = useLocation()
  const period = props.year || props.period

  const [currentSection, navLinks] = getTabLinks(pathname)

  const ctx = useContext(ReplenishmentContext)

  const periodOptions = props.period
    ? scPeriodOptions(ctx.periods)
    : scAnnualOptions(ctx.periods)

  const dateOfLastUpdate = ctx.asOfDate.as_of_date
  const title = period
    ? `Status of contributions for ${period}`
    : `Status of contributions (1991 - ${new Date().getFullYear()})`

  const Component = currentSection?.component ?? SCSummary

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 print:flex-col print:items-start">
        <h2 className="flex shrink flex-wrap items-center gap-1">
          <span className="whitespace-normal">
            {title} as of {dateOfLastUpdate} (USD)
          </span>
        </h2>
        <div className="flex items-center gap-2 print:hidden">
          {currentSection?.showPeriodSelector ?? true ? (
            <PeriodSelector
              key={currentSection?.label}
              label=""
              period={period}
              periodOptions={periodOptions}
            />
          ) : null}
          <nav className="flex items-center rounded-lg border border-solid border-primary">
            {navLinks}
          </nav>
        </div>
        <h1 className="my-0 hidden text-5xl leading-normal print:inline-block">
          {currentSection?.label}
        </h1>
      </div>
      <Component {...props} />
    </section>
  )
}

function SCViewWrapper(props: SCViewProps) {
  // Wrapper used to avoid flicker when no period is given.
  return props.period ? <SCView {...props} /> : <div className="h-screen"></div>
}

export { SCView, SCViewWrapper }
