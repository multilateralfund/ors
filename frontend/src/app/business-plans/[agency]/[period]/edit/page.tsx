import { Metadata } from 'next'

import BPEdit from '@ors/components/manage/Blocks/BusinessPlans/BPEdit'
import { BpPathParams } from '@ors/components/manage/Blocks/BusinessPlans/types'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails(props: {
  params: BpPathParams
}) {
  const { agency, period } = props.params
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>Business Plans</PageHeading>
      </HeaderTitle>
      <BPEdit agency={agency} period={period} />
    </PageWrapper>
  )
}
