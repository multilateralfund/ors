import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import CPListing from '@ors/components/manage/Blocks/CountryProgramme/CPListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/Api'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgramme() {
  const reports = await api('api/country-programme/reports/', {}, false)

  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          Country programmes
        </Typography>
      </HeaderTitle>
      <CPListing reports={reports} />
    </PageWrapper>
  )
}
