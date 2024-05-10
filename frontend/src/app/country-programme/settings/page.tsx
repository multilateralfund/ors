import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import CPSettings from '@ors/components/manage/Blocks/CountryProgramme/CPSettings'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function CPSettingsWrapper() {
  return (
    <PageWrapper className="mx-auto max-w-screen-xl">
      <HeaderTitle>
        <div className="mx-auto max-w-screen-xl">
          <Typography
            className="text-typography-primary"
            component="h1"
            variant="h3"
          >
            Settings
          </Typography>
        </div>
      </HeaderTitle>
      <CPSettings />
    </PageWrapper>
  )
}
