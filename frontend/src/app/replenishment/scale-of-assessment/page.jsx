'use client'

import { useContext } from 'react'

import { useRouter } from 'next/navigation'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
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

  return (
    <PageWrapper
      className="w-full rounded-b-lg bg-white p-4"
      defaultSpacing={false}
    >
      <ReplenishmentHeading showPeriodSelector={true}>
        Scale of assessment
      </ReplenishmentHeading>
      <SAView />
    </PageWrapper>
  )
}
