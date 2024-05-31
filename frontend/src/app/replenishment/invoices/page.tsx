import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Replenishment - Invoices',
}

export default async function ReplenishmentInvoices() {
  return (
    <PageWrapper className="max-w-screen-xl lg:px-0">
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Replenishment - Invoices
        </Typography>
      </HeaderTitle>
    </PageWrapper>
  )
}
