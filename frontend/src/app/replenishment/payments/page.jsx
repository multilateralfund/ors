'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import PaymentsView from '@ors/components/manage/Blocks/Replenishment/Payments/PaymentsView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentPayments() {
  return (
    <>
      <title>Replenishment - Payments</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>Payments</ReplenishmentHeading>
        <DownloadButtons />
        <PaymentsView />
      </PageWrapper>
    </>
  )
}
