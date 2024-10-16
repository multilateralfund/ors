'use client'

import { useRouter } from 'next/navigation'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import { SCViewWrapper } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentSoCAnnual() {
  const router = useRouter()

  const currentYear = new Date().getFullYear()

  router.replace(`/replenishment/status-of-contributions/annual/${currentYear}`)

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
