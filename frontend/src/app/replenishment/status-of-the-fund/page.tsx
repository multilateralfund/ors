import usePageTitle from '@ors/hooks/usePageTitle'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import StatusOfTheFundWrapper from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/StatusOfTheFundWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { formatApiUrl } from '@ors/helpers'

export default function ReplenishmentStatusOfTheFund() {
  usePageTitle('Replenishment - Status of the fund')
  return (
    <PageWrapper className="w-full p-4" defaultSpacing={false}>
      <ReplenishmentHeading>Status of the fund</ReplenishmentHeading>
      <DownloadButtons
        downloadTexts={['Download', 'Download Financial Data']}
        downloadUrls={[
          formatApiUrl('/api/replenishment/dashboard/export'),
          formatApiUrl('/api/replenishment/input-data/export'),
        ]}
      />
      <StatusOfTheFundWrapper />
    </PageWrapper>
  )
}
