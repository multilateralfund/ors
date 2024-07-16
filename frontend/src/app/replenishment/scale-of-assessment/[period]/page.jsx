'use client'

import React from 'react'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import ReplenishmentHeading from '@ors/app/replenishment/ReplenishmentHeading'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ReplenishmentScaleOfAssessment(props) {
  const { period } = props.params
  return (
    <PageWrapper
      className="w-full rounded-b-lg bg-white p-4"
      defaultSpacing={false}
    >
      <ReplenishmentHeading showPeriodSelector={true}>
        Scale of assessment
      </ReplenishmentHeading>
      <DownloadButtons />
      <SAView period={period} />
    </PageWrapper>
  )
}
