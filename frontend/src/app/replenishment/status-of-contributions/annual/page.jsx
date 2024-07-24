'use client'

import { useContext } from 'react'

import { useRouter } from 'next/navigation'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import { SCViewWrapper } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'

export default function ReplenishmentSoCAnnual() {
  const ctxPeriods = useContext(ReplenishmentContext)
  const router = useRouter()

  if (ctxPeriods.periodOptions.length > 0) {
    // const period = ctxPeriods.periodOptions[0].value
    // const start_year = period.split('-')[0]

    router.replace(`/replenishment/status-of-contributions/annual/2023`)
  }
  return (
    <>
      <title>Replenishment - Status of contributions</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>Status of contributions</ReplenishmentHeading>
        <DownloadButtons />
        <SCViewWrapper />
      </PageWrapper>
    </>
  )
}
