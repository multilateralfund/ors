import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import PaymentsTableView from '@ors/components/manage/Blocks/Replenishment/PaymentsTableView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Replenishment - Payments',
}

export default async function ReplenishmentPayments() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Replenishment - Payments
        </Typography>
      </HeaderTitle>
      <PaymentsTableView />
    </PageWrapper>
  )
}
