import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SCView from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Status of contributions',
}

export default async function ReplenishmentSoCAnnual(props) {
  const { year } = props.params
  return (
    <PageWrapper className="w-full p-4" defaultSpacing={false}>
      <ReplenishmentHeading>Status of contributions</ReplenishmentHeading>
      <SCView year={year} />
    </PageWrapper>
  )
}
