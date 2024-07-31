'use client'

import React from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import useGetBpPeriods from '@ors/components/manage/Blocks/BusinessPlans/BPList/useGetBPPeriods'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import styles from './styles.module.css'

const SECTIONS = [
  {
    label: 'Plans',
    path: '/business-plans/all/plans',
  },
  {
    label: 'All Activities',
    path: '/business-plans/all/activities',
  },
]

function getNavLinks(pathname: string, period: null) {
  const result: React.ReactElement[] = []

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
        href={period != null ? `${entry.path}/${period}` : entry.path}
      >
        {entry.label}
      </Link>,
    )
  }

  return [currentSection, result]
}

function BusinessPlansList(props: any) {
  const { periodOptions } = useGetBpPeriods()
  const { children } = props

  const pathname = usePathname()
  const period = getPathPeriod(pathname)

  const [_, navLinks] = getNavLinks(pathname, period)

  return (
    <>
      <div className={cx('print:hidden', styles.nav)}>
        {/* @ts-ignore */}
        <nav className="shrink-0">{navLinks}</nav>
        <PeriodSelector
          label="Triennial"
          period={period}
          periodOptions={[{ label: 'All', value: null }, ...periodOptions]}
        />
        {/*<div id="replenishment-tab-buttons" className="self-end"></div>*/}
      </div>
      <div className={styles.page}>{children}</div>
    </>
  )
}

export default function BusinessPlansListLayout({ children }: any) {
  return (
    <PageWrapper className="max-w-screen-xl print:p-0">
      <BusinessPlansList>{children}</BusinessPlansList>
    </PageWrapper>
  )
}
