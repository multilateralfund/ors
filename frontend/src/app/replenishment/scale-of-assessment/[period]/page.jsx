import React from 'react'

import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata = {
  title: 'Replenishment - Scale of assessment',
}

export default async function ReplenishmentScaleOfAssessment(props) {
  const { period } = props.params
  return (
    <PageWrapper
      className="w-full rounded-b-lg bg-white p-4"
      defaultSpacing={false}
    >
      <ReplenishmentHeading>Scale of assessment</ReplenishmentHeading>
      <SAView period={period} />
    </PageWrapper>
  )
}
