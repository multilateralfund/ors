'use client'

import { PropsWithChildren, useEffect } from 'react'

import cx from 'classnames'
import { useLocation, Link } from 'wouter'

import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import { useStore } from '@ors/store'

import styles from '@ors/app/business-plans/list/styles.module.css'

const SECTIONS = [
  {
    label: 'Report Info',
    path: '/business-plans/list/report-info',
  },
  {
    label: 'Activities',
    path: '/business-plans/list/activities',
  },
]

const getNavLinks = (pathname: string, period: null | string) => {
  const currentSection = SECTIONS.find((entry) =>
    pathname.startsWith(entry.path),
  )

  const result = SECTIONS.map((entry, i) => {
    const isCurrent = pathname.startsWith(entry.path)
    return (
      <Link
        key={i}
        className={cx('text-nowrap', { [styles.current]: isCurrent })}
        href={period != null ? `${entry.path}/${period}` : entry.path}
      >
        {entry.label}
      </Link>
    )
  })

  return [currentSection, result]
}

const BPListTabs = (props: PropsWithChildren) => {
  const { children } = props

  const [pathname] = useLocation()
  const period = getPathPeriod(pathname)

  const { setBPFilters } = useStore((state) => state.bpFilters)

  useEffect(() => {
    if (period) {
      setBPFilters({ range: period })
    }
  }, [period, setBPFilters])

  const [_, navLinks] = getNavLinks(pathname, period)

  return (
    <>
      <div className={cx('print:hidden', styles.nav)}>
        {/* @ts-ignore */}
        <nav className="shrink-0">{navLinks}</nav>
        <div id="bp-activities-export-button" className="mb-1 ml-4 self-end" />
      </div>
      <div className={styles.page}>{children}</div>
    </>
  )
}

export default BPListTabs
