'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import StatisticsView from '@ors/components/manage/Blocks/Replenishment/Statistics/StatisticsView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { formatApiUrl } from '@ors/helpers'

export default function ReplenishmentStatistics() {
  return (
    <>
      <title>Replenishment - Statistics</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>Statistics</ReplenishmentHeading>
        <DownloadButtons
          downloadTexts={['Download']}
          downloadUrls={[formatApiUrl('/api/replenishment/dashboard/export')]}
        />
        <StatisticsView />
      </PageWrapper>
    </>
  )
}