'use client'

import DownloadButtons from '@ors/app/replenishment/DownloadButtons'
import SAView from '@ors/components/manage/Blocks/Replenishment/SAView'
import SAHeading from '@ors/components/manage/Blocks/Replenishment/SAView/SAHeading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import SoAProvider from '@ors/contexts/Replenishment/SoAProvider'

export default function ReplenishmentScaleOfAssessment(props: {
  params: { period: string }
}) {
  const { period } = props.params
  return (
    <>
      <title>Replenishment - Scale of assessment</title>
      <PageWrapper
        className="w-full rounded-b-lg bg-white p-4"
        defaultSpacing={false}
      >
        <SoAProvider startYear={period.split('-')[0]}>
          <SAHeading />
          <SAView period={period} />
        </SoAProvider>
      </PageWrapper>
    </>
  )
}