import { Metadata } from 'next'

import BPEdit from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/BPEdit'
import { BpPathParams } from '@ors/components/manage/Blocks/BusinessPlans/types'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails(props: {
  params: BpPathParams
}) {
  const { agency, period } = props.params
  return (
    <PageWrapper>
      <BPEdit agency={agency} period={period} />
    </PageWrapper>
  )
}
