import SoCView from '@ors/components/manage/Blocks/Replenishment/SoCView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Status of contributions',
}

export default async function ReplenishmentSoCSummary() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <div className="mb-2 font-[500] uppercase">Replenishment</div>
        <PageHeading>Status of contributions</PageHeading>
      </HeaderTitle>
      <SoCView />
    </PageWrapper>
  )
}
