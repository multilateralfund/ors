'use client'

import { useLocation } from 'wouter'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import { SCViewWrapper } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentSoCAnnual() {
  const [ _, setLocation ] = useLocation()

  const currentYear = new Date().getFullYear()

  setLocation(`/annual/${currentYear}`)

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
