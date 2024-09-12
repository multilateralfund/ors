'use client'

import { PropsWithChildren } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

import styles from './styles.module.css'

interface Tab {
  label: string
  path: string
}

const SECTIONS: Tab[] = [
  {
    label: 'Dashboard',
    path: '/replenishment/dashboard',
  },
  {
    label: 'Status of contributions',
    path: '/replenishment/status-of-contributions',
  },
  {
    label: 'Scale of assessment',
    path: '/replenishment/scale-of-assessment',
  },
  {
    label: 'Invoices',
    path: '/replenishment/invoices',
  },
  {
    label: 'Payments',
    path: '/replenishment/payments',
  },
]

function getNavLinks(pathname: string): [Tab | undefined, JSX.Element[]] {
  const result: JSX.Element[] = []

  let currentSection: Tab | undefined

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
        href={entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

function ReplenishmentLayoutContent(props: PropsWithChildren) {
  const { children } = props

  const pathname = usePathname()

  const [_, navLinks] = getNavLinks(pathname)

  return (
    <>
      <div className={cx('print:hidden', styles.nav)}>
        <nav>{navLinks}</nav>
        <div id="replenishment-tab-buttons" className="self-end"></div>
      </div>
      <div className={styles.page}>{children}</div>
    </>
  )
}

export default function ReplenishmentLayout({ children }: PropsWithChildren) {
  return (
    <PageWrapper className="max-w-screen-2xl print:p-0">
      <ReplenishmentProvider>
        <ReplenishmentLayoutContent>{children}</ReplenishmentLayoutContent>
      </ReplenishmentProvider>
    </PageWrapper>
  )
}
