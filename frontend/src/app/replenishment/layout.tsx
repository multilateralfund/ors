'use client'

import React from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { PERIODS } from '@ors/components/manage/Blocks/Replenishment/constants'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import styles from './styles.module.css'

const SECTIONS = [
  { label: 'Dashboard', path: '/replenishment/dashboard' },
  { label: 'Scale of assessment', path: '/replenishment/scale-of-assessment' },
  { label: 'Invoices', path: '/replenishment/invoices' },
  { label: 'Payments', path: '/replenishment/payments' },
]

function getPathPeriod(path: string) {
  let result = null
  const candidate = path.split('/').at(-1)

  for (let i = 0; i < PERIODS.length; i++) {
    if (candidate === PERIODS[i]) {
      result = candidate
      break
    }
  }

  return result
}

export default function ReplenishmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const period = getPathPeriod(pathname)
  const navLinks = []

  for (let i = 0; i < SECTIONS.length; i++) {
    const entry = SECTIONS[i]
    const isCurrent = pathname.startsWith(entry.path)
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
          <PeriodSelector period={period} />
        </div>
      </div>
      <div className={styles.page}>{children}</div>
    </PageWrapper>
  )
}
