import { Typography } from '@mui/material'
import { Metadata } from 'next'

import BPView from "@ors/components/manage/Blocks/BusinessPlans/BPView";
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

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
        <Typography component="h1" variant="h3">
          Business Plans
        </Typography>
      </HeaderTitle>
      <BPView
        agency={agency}
        end_year={parseInt(end_year, 10)}
        start_year={parseInt(start_year, 10)}
      />
    </PageWrapper>
  )
}
