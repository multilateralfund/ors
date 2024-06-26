import { Metadata } from 'next'

import BPEdit from '@ors/components/manage/Blocks/BusinessPlans/BPEdit'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails(props: {
  params: {
    agency: string
    end_year: string
    start_year: string
  }
}) {
  const { agency, end_year, start_year } = props.params
  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading>Business Plans</PageHeading>
      </HeaderTitle>
      <BPEdit
        agency={agency}
        end_year={parseInt(end_year, 10)}
        start_year={parseInt(start_year, 10)}
      />
    </PageWrapper>
  )
}
