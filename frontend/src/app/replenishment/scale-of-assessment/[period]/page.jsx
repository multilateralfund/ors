import React from 'react'

import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata = {
  title: 'Replenishment - Scale of assessment',
}

export default async function ReplenishmentScaleOfAssessment(props) {
  const { period } = props.params
  return (
    <PageWrapper className="w-full p-2" defaultSpacing={false}>
      <HeaderTitle>
        <PageHeading>Replenishment - Scale of assessment</PageHeading>
      </HeaderTitle>
      <SAView period={period} />
    </PageWrapper>
  )
}
