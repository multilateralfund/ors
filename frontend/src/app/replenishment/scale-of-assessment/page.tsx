import type { Metadata } from 'next'

import React from 'react'

import { Typography } from '@mui/material'

import ReplenishmentTableView from '@ors/components/manage/Blocks/Replenishment/ReplenishmentTableView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Replenishment - Scale of assessment',
}

export default async function ReplenishmentScaleOfAssessment() {
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <Typography
          className="text-typography-primary"
          component="h1"
          variant="h3"
        >
          Replenishment - Scale of assessment
        </Typography>
      </HeaderTitle>
      <ReplenishmentTableView />
    </PageWrapper>
  )
}
