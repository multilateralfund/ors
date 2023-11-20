import React from 'react'

import { Typography } from "@mui/material"
import { Metadata } from 'next'

import BusinessPlansListing from "@ors/components/manage/Blocks/Listing/BusinessPlansListing/BusinessPlansListing";
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlans() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          Business Plans
        </Typography>
      </HeaderTitle>
      <BusinessPlansListing/>
    </PageWrapper>
  )
}
