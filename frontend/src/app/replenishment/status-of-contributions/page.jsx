import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Status of contributions',
}

export default async function ReplenishmentStatusOfContribution() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <PageHeading>Replenishment - Status of contributions</PageHeading>
      </HeaderTitle>
      <span>status-of-contributions</span>
    </PageWrapper>
  )
}
