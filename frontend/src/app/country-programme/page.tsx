import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import CPListing from '@ors/components/manage/Blocks/CountryProgramme/CPListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgramme() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Country programmes
        </Typography>
      </HeaderTitle>
      <CPListing />
    </PageWrapper>
  )
}
