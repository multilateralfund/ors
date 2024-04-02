import type { Metadata } from 'next'

import { Typography } from '@mui/material'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function Dashboard() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography component="h1" variant="h3">
          Dashboard
        </Typography>
      </HeaderTitle>
    </PageWrapper>
  )
}
