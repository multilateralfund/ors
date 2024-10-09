'use client'

import { PropsWithChildren } from 'react'

import cx from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

interface Tab {
  label: string
  path: string
}

const SECTIONS: Tab[] = [
  {
    label: 'Scale of assessment',
    path: '/replenishment/scale-of-assessment',
  },
  {
    label: 'Status of the fund',
    path: '/replenishment/status-of-the-fund',
  },
  {
    label: 'Statistics',
    path: '/replenishment/statistics',
  },
  {
    label: 'Status of contributions',
    path: '/replenishment/status-of-contributions',
  },
  {
    label: 'In/out flows',
    path: '/replenishment/in-out-flows',
  },
  {
    label: 'Dashboard',
    path: '/replenishment/dashboard',
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
        className={cx(
          'inline-block text-nowrap rounded-t-lg px-3 py-2 text-xl font-bold uppercase leading-[2.65rem] text-gray-400 no-underline hover:bg-primary hover:text-mlfs-hlYellow',
          { 'bg-primary text-mlfs-hlYellow': isCurrent },
        )}
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
      <div className="flex w-[96vw] flex-wrap-reverse items-center justify-between lg:w-full lg:flex-nowrap print:hidden">
        <div className="overflow-scroll">
          <nav className="flex items-center gap-4">{navLinks}</nav>
        </div>
        <div id="replenishment-tab-buttons" className="self-end"></div>
      </div>
      <div className="rounded-b-lg border border-solid border-primary print:border-none">
        {children}
      </div>
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
