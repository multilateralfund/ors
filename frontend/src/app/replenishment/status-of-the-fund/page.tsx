'use client'
import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import StatusOfTheFundWrapper from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/StatusOfTheFundWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { formatApiUrl } from '@ors/helpers'

export default function ReplenishmentStatusOfTheFund() {
  return (
    <>
      <title>Replenishment - Status of the fund</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>Status of the fund</ReplenishmentHeading>
        <DownloadButtons
          downloadTexts={['Download']}
          downloadUrls={[formatApiUrl('/api/replenishment/dashboard/export')]}
        />
        <StatusOfTheFundWrapper />
      </PageWrapper>
    </>
  )
}
