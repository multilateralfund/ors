import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export default async function ReplenishmentHeading(props) {
  return (
    <HeaderTitle>
      <div className="mb-2 font-[500] uppercase">Replenishment</div>
      <PageHeading>{props.children}</PageHeading>
    </HeaderTitle>
  )
}
