import React from 'react'

import DashboardView from '@ors/components/manage/Blocks/Replenishment/DashboardView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Dashboard',
}

export default async function ReplenishmentDashboard() {
  return (
    <PageWrapper
      className="w-full rounded-b-lg bg-white p-4"
      defaultSpacing={false}
    >
      <HeaderTitle>
        <PageHeading>Replenishment - Dashboard</PageHeading>
      </HeaderTitle>
      <DashboardView />
    </PageWrapper>
  )
}
