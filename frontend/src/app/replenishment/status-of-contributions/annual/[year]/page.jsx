'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import { SCView } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { formatApiUrl } from '@ors/helpers'

export default function ReplenishmentSoCAnnual(props) {
  const { year } = props.params
  return (
    <>
      <title>Replenishment - Status of contributions</title>
      <PageWrapper className="w-full p-4" defaultSpacing={false}>
        <ReplenishmentHeading>Status of contributions</ReplenishmentHeading>
        <DownloadButtons
          downloadTexts={['Download ALL', 'Download Current View']}
          downloadUrls={[
            formatApiUrl('/api/replenishment/status-of-contributions/statistics-export/'),
            formatApiUrl(`/api/replenishment/status-of-contributions/${year}/export`),
            ]}
        />
        <SCView year={year} />
      </PageWrapper>
    </>
  )
}
