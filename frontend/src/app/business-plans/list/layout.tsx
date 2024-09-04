'use client'

import React, { useContext, useEffect } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import CustomLink from '@ors/components/ui/Link/Link'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'
import { useStore } from '@ors/store'

import styles from './styles.module.css'

const SECTIONS = [
  {
    label: 'Plans',
    path: '/business-plans/list/plans',
  },
  {
    label: 'All Activities',
    path: '/business-plans/list/activities',
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

function BusinessPlansList(props: any) {
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { children } = props

  const pathname = usePathname()
  const period = getPathPeriod(pathname)

  const { setBPFilters } = useStore((state) => state.bpFilters)

  useEffect(() => {
    setBPFilters({ range: period })
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
  return (
    <div className="mb-8 flex items-center justify-between">
      <PageHeading>Business Plans</PageHeading>
      <CustomLink
        className="px-4 py-2 text-lg uppercase"
        color="secondary"
        href="/business-plans/create"
        variant="contained"
        button
      >
        Create new plan
      </CustomLink>
    </div>
  )
}

export default function BusinessPlansListLayout({ children }: any) {
  return (
    <PageWrapper className="max-w-screen-xl print:p-0">
      <BPYearRangesProvider>
        <BPListHeader />
        <BusinessPlansList>{children}</BusinessPlansList>
      </BPYearRangesProvider>
    </PageWrapper>
  )
}
