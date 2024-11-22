'use client'

import React, { PropsWithChildren, useContext, useEffect } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import { useStore } from '@ors/store'

import styles from '@ors/app/business-plans/list/styles.module.css'

const SECTIONS = [
  {
    label: 'Plans',
    path: '/business-plans/list/plans',
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
        className={cx({ [styles.current]: isCurrent })}
        href={period != null ? `${entry.path}/${period}` : entry.path}
      >
        {entry.label}
      </Link>
    )
  })

  return [currentSection, result]
}

const BPListTabs = (props: PropsWithChildren) => {
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { children } = props

  const pathname = usePathname()
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
        <div className={cx('flex flex-row', styles.moreOptions)}>
          <PeriodSelector
            label="Triennial"
            period={period}
            periodOptions={[...periodOptions]}
          />
          <div
            id="bp-activities-export-button"
            className="ml-4 mt-0.5 self-center"
          />
        </div>
      </div>
      <div className={styles.page}>{children}</div>
    </>
  )
}

export default BPListTabs
