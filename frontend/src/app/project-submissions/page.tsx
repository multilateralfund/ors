import React from 'react'

import { Typography } from '@mui/material'
import { Metadata } from 'next'

import PSListing from '@ors/components/manage/Blocks/ProjectSubmissions/PSListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  description: 'Listing of newly submitted projects',
  title: 'Project submissions',
}

export default async function ProjectSubmissions() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography component="h1" variant="h3">
          Project submissions
        </Typography>
      </HeaderTitle>
      <PSListing />
    </PageWrapper>
  )
}
