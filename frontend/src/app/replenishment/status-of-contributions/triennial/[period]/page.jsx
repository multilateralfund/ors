import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SCView from '@ors/components/manage/Blocks/Replenishment/StatusOfContribution/SCView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Status of contributions',
}

export default async function ReplenishmentSoCTriennial(props) {
  const { period } = props.params
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <ReplenishmentHeading>Status of contributions</ReplenishmentHeading>
      <SCView period={period} />
    </PageWrapper>
  )
}
