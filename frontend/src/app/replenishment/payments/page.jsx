import React from 'react'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import PaymentsView from '@ors/components/manage/Blocks/Replenishment/PaymentsView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Payments',
}

export default async function ReplenishmentPayments() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <ReplenishmentHeading>Payments</ReplenishmentHeading>
      <PaymentsView />
    </PageWrapper>
  )
}
