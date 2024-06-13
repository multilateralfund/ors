import React from 'react'

import { Typography } from '@mui/material'

import DashboardView from '@ors/components/manage/Blocks/Replenishment/DashboardView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Dashboard',
}

export default async function ReplenishmentDashboard() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Replenishment - Dashboard
        </Typography>
      </HeaderTitle>
      <DashboardView />
    </PageWrapper>
  )
}
