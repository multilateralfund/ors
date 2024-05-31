'use client'

import React from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import styles from './styles.module.css'

const SECTIONS = [
  { label: 'Dashboard', path: '/replenishment/dashboard' },
  { label: 'Scale of assessment', path: '/replenishment/scale-of-assessment' },
  { label: 'Invoices', path: '/replenishment/invoices' },
  { label: 'Payments', path: '/replenishment/payments' },
]

export default function ReplenishmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const navLinks = []
  for (let i = 0; i < SECTIONS.length; i++) {
    const entry = SECTIONS[i]
    const isCurrent = pathname.startsWith(entry.path)
    navLinks.push(
      <Link
        key={i}
        className={cx({ [styles.current]: isCurrent })}
        href={entry.path}
      >
        {entry.label}
      </Link>,
    )
  }
  return (
    <PageWrapper className="max-w-screen-2xl">
      <nav className={styles.nav}>{navLinks}</nav>
      <div className={styles.page}>{children}</div>
    </PageWrapper>
  )
}
