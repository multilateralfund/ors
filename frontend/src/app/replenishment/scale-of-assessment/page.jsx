'use client'

import { useContext, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

export default function Replenishment() {
  const router = useRouter()
  const ctxPeriods = useContext(ReplenishmentContext)

  // Redirect to latest period
  useEffect(() => {
    if (ctxPeriods.periodOptions.length > 0) {
      router.replace(
        `/replenishment/scale-of-assessment/${ctxPeriods.periodOptions[0].value}`,
      )
    }
  }, [ctxPeriods.periodOptions, router])

  // Return SAView so that there is no flicker after the redirect.
  return (
    <>
      <title>Replenishment - Scale of assessment</title>
      <PageWrapper
        className="w-full rounded-b-lg bg-white p-4"
        defaultSpacing={false}
      >
        <ReplenishmentHeading showPeriodSelector={false}>
          Scale of assessment
        </ReplenishmentHeading>
        <SAView />
      </PageWrapper>
    </>
  )
}
