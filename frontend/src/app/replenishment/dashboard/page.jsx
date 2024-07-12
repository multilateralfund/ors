import React from 'react'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import DashboardView from '@ors/components/manage/Blocks/Replenishment/DashboardView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Dashboard',
}

export default async function ReplenishmentDashboard() {
  return (
    <PageWrapper
      className="w-full rounded-b-lg bg-white p-4"
      defaultSpacing={false}
    >
      <ReplenishmentHeading>Dashboard</ReplenishmentHeading>
      <DashboardView />
    </PageWrapper>
  )
}
