import React from 'react'

import PaymentsView from '@ors/components/manage/Blocks/Replenishment/PaymentsView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Payments',
}

export default async function ReplenishmentPayments() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <PageHeading>Replenishment - Payments</PageHeading>
      </HeaderTitle>
      <PaymentsView />
    </PageWrapper>
  )
}
