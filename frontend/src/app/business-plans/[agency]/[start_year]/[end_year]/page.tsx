import { Metadata } from 'next'

import BPView from '@ors/components/manage/Blocks/BusinessPlans/BPView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>Business Plans</PageHeading>
      </HeaderTitle>
      <BPView />
    </PageWrapper>
  )
}
