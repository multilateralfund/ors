'use client'

import { useContext } from 'react'

import { useRouter } from 'next/navigation'

import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import ReplenishmentProvider from '@ors/contexts/Replenishment/ReplenishmentProvider'

export default function Replenishment() {
  const router = useRouter()
  const ctxPeriods = useContext(ReplenishmentContext)

  if (ctxPeriods.periodOptions.length > 0) {
    router.replace(
      `/replenishment/scale-of-assessment/${ctxPeriods.periodOptions[0].value}`,
    )
  }
}
