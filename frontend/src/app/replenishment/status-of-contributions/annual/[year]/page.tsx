import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SCDownload from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCDownload'
import { SCView } from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentSoCAnnual() {
  usePageTitle('Replenishment - Status of contributions')
  const { year } = useParams<Record<string, string>>()
  return (
    <PageWrapper className="w-full p-4" defaultSpacing={false}>
      <ReplenishmentHeading>Status of contributions</ReplenishmentHeading>
      <SCDownload year={year} />
      <SCView year={year} />
    </PageWrapper>
  )
}
