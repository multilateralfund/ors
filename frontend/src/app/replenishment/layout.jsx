'use client'

import { useContext } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

import styles from './styles.module.css'

const SECTIONS = [
  {
    label: 'Dashboard',
    path: '/replenishment/dashboard',
    showPeriodSelector: false,
  },
  {
    label: 'Status of contributions',
    path: '/replenishment/status-of-contributions',
    showPeriodSelector: false,
  },
  {
    label: 'Scale of assessment',
    path: '/replenishment/scale-of-assessment',
  },
  {
    extraPeriodOptions: [{ label: 'All', value: '' }],
    label: 'Invoices',
    path: '/replenishment/invoices',
  },
  {
    extraPeriodOptions: [{ label: 'All', value: '' }],
    label: 'Payments',
    path: '/replenishment/payments',
  },
]

function getNavLinks(pathname, period) {
  const result = []

  let currentSection

  for (let i = 0; i < SECTIONS.length; i++) {
    const entry = SECTIONS[i]
    const isCurrent = pathname.startsWith(entry.path)
    if (isCurrent) {
      currentSection = SECTIONS[i]
    }
    result.push(
      <Link
        key={i}
        className={cx({ [styles.current]: isCurrent })}
        href={i > 0 && period != null ? `${entry.path}/${period}` : entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

function ReplenishmentLayoutContent(props) {
  const { children } = props

  const pathname = usePathname()
  const period = getPathPeriod(pathname)

  const [currentSection, navLinks] = getNavLinks(pathname, period)

  const ctx = useContext(ReplenishmentContext)

  return (
    <>
      <div className={styles.nav}>
        <nav>{navLinks}</nav>
        <div>
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
        </div>
      </div>
      <div className={styles.page}>{children}</div>
    </>
  )
}

export default function ReplenishmentLayout({ children }) {
  return (
    <PageWrapper className="max-w-screen-2xl">
      <ReplenishmentProvider>
        <ReplenishmentLayoutContent>{children}</ReplenishmentLayoutContent>
      </ReplenishmentProvider>
    </PageWrapper>
  )
}
