import React from 'react'

import { Typography } from '@mui/material'
import { Metadata } from 'next'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlans() {
  return (
    <PageWrapper className="max-w-screen-xl lg:px-0">
      <HeaderTitle>
        <Typography
          className="mx-auto max-w-screen-xl text-typography-primary"
          component="h1"
          variant="h3"
        >
          Business Plans
        </Typography>
      </HeaderTitle>
      <div>Create a business plan</div>
    </PageWrapper>
  )
}
