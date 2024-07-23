'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import DashboardView from '@ors/components/manage/Blocks/Replenishment/Dashboard/DashboardView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentDashboard() {
  return (
    <>
      <title>Replenishment - Dashboard</title>
      <PageWrapper
        className="w-full rounded-b-lg bg-white p-4"
        defaultSpacing={false}
      >
        <ReplenishmentHeading>Dashboard</ReplenishmentHeading>
        <DownloadButtons />
        <DashboardView />
      </PageWrapper>
    </>
  )
}
