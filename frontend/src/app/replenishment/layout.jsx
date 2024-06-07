'use client'

import React from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { PERIODS_AS_OPTIONS } from '@ors/components/manage/Blocks/Replenishment/constants'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import styles from './styles.module.css'

const SECTIONS = [
  { label: 'Dashboard', path: '/replenishment/dashboard' },
  {
    label: 'Scale of assessment',
    path: '/replenishment/scale-of-assessment',
    periodOptions: PERIODS_AS_OPTIONS,
  },
  {
    label: 'Invoices',
    path: '/replenishment/invoices',
    periodOptions: [{ label: 'All', value: '' }, ...PERIODS_AS_OPTIONS],
  },
  {
    label: 'Payments',
    path: '/replenishment/payments',
    periodOptions: [{ label: 'All', value: '' }, ...PERIODS_AS_OPTIONS],
  },
]

export default function ReplenishmentLayout({
  children,
}) {
  const pathname = usePathname()
  const period = getPathPeriod(pathname)
  const navLinks = []

  let currentSection

  for (let i = 0; i < SECTIONS.length; i++) {
    const entry = SECTIONS[i]
    const isCurrent = pathname.startsWith(entry.path)
    if (isCurrent) {
      currentSection = SECTIONS[i]
    }
    navLinks.push(
      <Link
        key={i}
        className={cx({ [styles.current]: isCurrent })}
        href={i > 0 && period != null ? `${entry.path}/${period}` : entry.path}
      >
        {entry.label}
      </Link>,
    )
  }
  return (
    <PageWrapper className="max-w-screen-2xl">
      <div className={styles.nav}>
        <nav>{navLinks}</nav>
        <div>
          {currentSection?.periodOptions ? (
            <PeriodSelector
              key={currentSection.label}
              period={period}
              periodOptions={currentSection.periodOptions}
            />
          ) : null}
        </div>
      </div>
      <div className={styles.page}>{children}</div>
    </PageWrapper>
  )
}
