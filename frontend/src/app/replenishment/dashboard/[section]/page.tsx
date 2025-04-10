import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import DashboardView from '@ors/components/manage/Blocks/Replenishment/Dashboard/DashboardView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { formatApiUrl } from '@ors/helpers'

export default function ReplenishmentDashboard() {
  usePageTitle('Replenishment - Dashboard')
  const { section } = useParams<Record<string, string>>()
  return (
    <>
      <title>Replenishment - Dashboard</title>
      <PageWrapper
        className="w-full rounded-b-lg bg-white p-4"
        defaultSpacing={false}
      >
        <ReplenishmentHeading>Dashboard</ReplenishmentHeading>
        <DownloadButtons
          downloadTexts={['Download']}
          downloadUrls={[formatApiUrl('/api/replenishment/dashboard/export')]}
          showPrintButton={false}
        />
        <DashboardView section={section} />
      </PageWrapper>
    </>
  )
}
