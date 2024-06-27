'use client'

import { useContext } from 'react'

import { useRouter } from 'next/navigation'

import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

export default function ReplenishmentSoCAnnual() {
  const ctxPeriods = useContext(ReplenishmentContext)
  const router = useRouter()

  if (ctxPeriods.periodOptions.length > 0) {
    const period = ctxPeriods.periodOptions[0].value

    router.replace(
      `/replenishment/status-of-contributions/triennial/${period}`,
    )
  }
}
