'use client'

import React, { useContext, useState } from 'react'
import { useLocation } from 'wouter'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { PeriodSelectorOption } from '@ors/components/manage/Blocks/Replenishment/types'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { AddButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import soAContext from '@ors/contexts/Replenishment/SoAContext'
import { api } from '@ors/helpers'

import { ReplenishmentHeadingProps } from './types'
import PermissionsContext from '@ors/contexts/PermissionsContext'

export default function ReplenishmentHeading(props: ReplenishmentHeadingProps) {
  const { canViewReplenishment } = useContext(PermissionsContext)
  const { extraPeriodOptions, showPeriodSelector } = props
  const [showAddNewSOA, setShowAddNewSOA] = useState(false)
  const [pathname, setLocation] = useLocation()
  const period = getPathPeriod(pathname)

  const replenishmentContext = useContext(ReplenishmentContext)
  const soaContext = useContext(soAContext)

  const createNextPeriod = (options: PeriodSelectorOption[]) => {
    if (!options) return

    const endYears = options.map((option) => {
      const years = option.value.split('-')
      return parseInt(years[1], 10)
    })

    const maxYear = Math.max(...endYears)
    return `${maxYear + 1}-${maxYear + 3}`
  }

  async function handleCreateNewSOA() {
    try {
      const newPeriod = createNextPeriod(replenishmentContext.periodOptions)
      setShowAddNewSOA(false)
      await api('/api/replenishment/replenishments/', {
        data: { amount: replenishmentContext.periods[0].amount },
        method: 'POST',
      })
      replenishmentContext.refetchData()
      setLocation(`/replenishment/scale-of-assessment/${newPeriod}`)
    } catch (error) {
      error.json().then((data: Record<string, string[]>) => {
        enqueueSnackbar(
          Object.entries(data)
            .map(([_, value]) => value)
            .join(' '),
          { variant: 'error' },
        )
      })
    }
  }

  const isLastPeriod = period === replenishmentContext?.periodOptions[0]?.value
  const showAddPeriod =
    soaContext?.version?.is_final && isLastPeriod && canViewReplenishment

  return (
    <HeaderTitle>
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 font-[500] uppercase">Replenishment</div>
          <PageHeading>{props.children}</PageHeading>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {showPeriodSelector ? (
            <PeriodSelector
              period={period}
              periodOptions={[
                ...(extraPeriodOptions ?? []),
                ...replenishmentContext.periodOptions,
              ]}
            />
          ) : null}
          {showAddPeriod && (
            <AddButton
              className="shrink-0"
              onClick={() => setShowAddNewSOA(true)}
            >
              Add Period
            </AddButton>
          )}
          {showAddNewSOA && (
            <ConfirmDialog
              title={`Add a new scale of assessment for ${createNextPeriod(replenishmentContext.periodOptions)}?`}
              onCancel={() => {
                setShowAddNewSOA(false)
              }}
              onSubmit={() => handleCreateNewSOA()}
            >
              <div className="flex justify-between gap-4">
                <p className="w-full text-lg">
                  The list of countries and their national currency used for
                  fixed exchange will be copied from the previous period.
                </p>
              </div>
            </ConfirmDialog>
          )}
        </div>
      </div>
    </HeaderTitle>
  )
}
