'use client'

import React, { useContext, useState } from 'react'

import { usePathname } from 'next/navigation'
import { enqueueSnackbar } from 'notistack'

import ConfirmDialog from '@ors/components/manage/Blocks/Replenishment/ConfirmDialog'
import PeriodSelector from '@ors/components/manage/Blocks/Replenishment/PeriodSelector'
import { getPathPeriod } from '@ors/components/manage/Blocks/Replenishment/utils'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { AddButton } from '@ors/components/ui/Button/Button'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import soAContext from '@ors/contexts/Replenishment/SoAContext'
import { api } from '@ors/helpers'

export default function ReplenishmentHeading(props) {
  const { extraPeriodOptions, showPeriodSelector } = props
  const [showAddNewSOA, setShowAddNewSOA] = useState(false)
  const pathname = usePathname()
  const period = getPathPeriod(pathname)

  console.log(period)

  const ctx = useContext(ReplenishmentContext)
  const ctx_2 = useContext(soAContext)

  console.log(ctx.periods[0]?.amount)
  console.log(ctx.periodOptions[0])

  async function handleCreateNewSOA() {
    try {
      setShowAddNewSOA(false)
      await api('/api/replenishment/replenishments/', {
        data: { amount: ctx.periods[0].amount },
        method: 'POST',
      })
      window.location.reload()
    } catch (error) {
      error.json().then((data) => {
        enqueueSnackbar(
          Object.entries(data)
            .map(([_, value]) => value)
            .join(' '),
          { variant: 'error' },
        )
      })
    }
  }

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
                ...ctx.periodOptions,
              ]}
            />
          ) : null}
          {ctx_2.version?.is_final && (
            <AddButton
              className="shrink-0"
              onClick={() => setShowAddNewSOA(true)}
            >
              Add Period
            </AddButton>
          )}
          {showAddNewSOA && (
            <ConfirmDialog
              title={`Add a new scale of assessment for ?`}
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
