import SCView from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Status of contributions',
}

export default async function ReplenishmentSoCAnnual(props) {
  const { year } = props.params
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <div className="mb-2 font-[500] uppercase">Replenishment</div>
        <PageHeading>Status of contributions</PageHeading>
      </HeaderTitle>
      <SCView year={year} />
    </PageWrapper>
  )
}
