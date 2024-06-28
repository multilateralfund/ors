'use client'

import { useContext } from 'react'

import { useRouter } from 'next/navigation'

import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

export default function ReplenishmentSoCAnnual() {
  const ctxPeriods = useContext(ReplenishmentContext)
  const router = useRouter()

  if (ctxPeriods.periodOptions.length > 0) {
    // const period = ctxPeriods.periodOptions[0].value
    // const start_year = period.split('-')[0]

    router.replace(
      `/replenishment/status-of-contributions/annual/2023`,
    )
  }
}
