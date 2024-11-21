'use client'

import React, { PropsWithChildren, useContext, useEffect } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import { useStore } from '@ors/store'

import styles from './styles.module.css'

const SECTIONS = [
  {
    label: 'Activities',
    path: '/business-plans/list/activities',
  },
  {
    label: 'By Agency',
    path: '/business-plans/list/plans',
  },
]

function getNavLinks(pathname: string, period: null | string) {
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

function BusinessPlansList(props: PropsWithChildren) {
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

function BPListHeader() {
  const { user_type } = useStore((state) => state.user?.data)

  return (
    <div className="mb-8 flex items-center justify-between">
      <PageHeading>Business Plans</PageHeading>
    </div>
  )
}

export default function BusinessPlansListLayout({ children }: any) {
  return (
    <PageWrapper className="print:p-0">
      <BPYearRangesProvider>
        <BPListHeader />
        <BusinessPlansList>{children}</BusinessPlansList>
      </BPYearRangesProvider>
    </PageWrapper>
  )
}
