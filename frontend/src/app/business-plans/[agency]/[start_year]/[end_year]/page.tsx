import { Typography } from '@mui/material'
import { Metadata } from 'next'

import BPView from '@ors/components/manage/Blocks/BusinessPlans/BPView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Business Plans',
}

export default async function BusinessPlansDetails() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography component="h1" variant="h3">
          Business Plans
        </Typography>
      </HeaderTitle>
      <BPView />
    </PageWrapper>
  )
}
