'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import PaymentsView from '@ors/components/manage/Blocks/Replenishment/Payments/PaymentsView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentPayments() {
  return (
    <PageWrapper className="w-full p-4" defaultSpacing={false}>
      <ReplenishmentHeading
        extraPeriodOptions={[{ label: 'All', value: '' }]}
        showPeriodSelector={true}
      >
        Payments
      </ReplenishmentHeading>
      <DownloadButtons />
      <PaymentsView />
    </PageWrapper>
  )
}
