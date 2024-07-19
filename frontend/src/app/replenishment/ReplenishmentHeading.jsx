'use client'

import { useContext, useMemo } from 'react'

import { usePathname } from 'next/navigation'

import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

export default function ReplenishmentHeading(props) {
  const { extraPeriodOptions, showPeriodSelector } = props

  const pathname = usePathname()
  const period = getPathPeriod(pathname)

  const ctx = useContext(ReplenishmentContext)

  return (
    <HeaderTitle>
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 font-[500] uppercase">Replenishment</div>
          <PageHeading>{props.children}</PageHeading>
        </div>
        <div className="print:hidden">
          {showPeriodSelector ? (
            <PeriodSelector
              period={period}
              periodOptions={[
                ...(extraPeriodOptions ?? []),
                ...ctx.periodOptions,
              ]}
            />
          ) : null}
        </div>
      </div>
    </HeaderTitle>
  )
}
