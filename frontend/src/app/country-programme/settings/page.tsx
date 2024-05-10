import type { Metadata } from 'next'

import React from 'react'

import {Typography} from "@mui/material";

import HeaderTitle from "@ors/components/theme/Header/HeaderTitle";
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function CPSettings() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Settings
        </Typography>
      </HeaderTitle>
    </PageWrapper>
  )
}
