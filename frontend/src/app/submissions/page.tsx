import React from 'react'

import { Typography } from '@mui/material'
import { Metadata } from 'next'

import SubmissionsListing from '@ors/components/manage/Blocks/Listing/SubmissionsListing/SubmissionsListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function Reports() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          Project submissions
        </Typography>
      </HeaderTitle>
      <SubmissionsListing />
    </PageWrapper>
  )
}
