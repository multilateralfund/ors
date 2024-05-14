import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import CPExport from '@ors/components/manage/Blocks/CountryProgramme/CPExport'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Export data',
}

export default async function CPExportData() {
  return (
    <PageWrapper className="mx-auto max-w-screen-xl">
      <HeaderTitle>
        <div className="container mx-auto max-w-screen-xl">
          <Typography
            className="text-typography-primary"
            component="h1"
            variant="h3"
          >
            Export data on Country Programme reports
          </Typography>
        </div>
      </HeaderTitle>
      <CPExport />
    </PageWrapper>
  )
}
